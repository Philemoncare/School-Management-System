import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SessionService } from "../security/services/session.service";
import { SecurityRiskService } from "../security/services/security-risk.service";
import { SecurityEventService } from "../security/services/security-event.service";
import * as argon2 from "argon2";
import { randomBytes, createHash } from "node:crypto";
import { EmailProvider } from "../communication/providers/email.provider";
import {
  EmailOtpService,
  LOGIN_OTP_TOKEN_TTL,
  OTP_CODE_LENGTH,
  OTP_TTL_MS,
} from "./email-otp.service";
import {
  Prisma,
  SecurityEventType,
  SecuritySeverity,
  AccountState,
  InvitationStatus,
} from "@prisma/client";
import {
  expandRoleAliases,
  platformPermissionsFor,
  schoolPermissionsFor,
} from "./platform-roles";
import { provisionPlatformSuperAdmin } from "./platform-role-provisioning";
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
    private readonly sessionService: SessionService,
    private readonly riskService: SecurityRiskService,
    private readonly securityEventService: SecurityEventService,
    private readonly emailProvider: EmailProvider,
    private readonly emailOtp: EmailOtpService,
  ) {}

  async validateUser(email: string, pass: string, context?: any): Promise<any> {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    // To prevent timing attacks/enumeration, we always perform the hash verification.
    // If user is not found, we verify against a dummy hash.
    const DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$Rdesc8r6hJ5dRQo6S9y/G7a5t41P9Xm+kX5Z+z4I6X4";

    const targetHash = user ? user.passwordHash : DUMMY_HASH;
    const passwordMatches = await argon2.verify(targetHash, pass).catch(() => false);

    if (!user || !passwordMatches) {
      if (user) {
        await this.securityEventService.logEvent({
          userId: user.id,
          eventType: "LOGIN_FAILURE" as any,
          severity: SecuritySeverity.LOW,
          metadata: { reason: "Invalid credentials" },
          ipAddress: context?.ip,
          userAgent: context?.userAgent,
        });

        // Check for brute force and lock account if necessary
        await this.checkAndLockAccount(user.id, context);
      }
      return null;
    }

    const blockedStates: AccountState[] = [
      AccountState.DISABLED,
      AccountState.SUSPENDED,
      AccountState.LOCKED,
      AccountState.COMPROMISED,
    ];

    const isVerificationRequired = process.env.SKIP_EMAIL_VERIFICATION !== 'true';
    if (isVerificationRequired && user.accountState === AccountState.PENDING_VERIFICATION) {
      blockedStates.push(AccountState.PENDING_VERIFICATION);
    }

    if (!user.isActive) {
      throw new ForbiddenException(
        "Your account is unavailable. Please contact your administrator.",
      );
    }

    if (blockedStates.includes(user.accountState)) {
      await this.securityEventService.logEvent({
        userId: user.id,
        eventType: "LOGIN_FAILURE" as any,
        severity: SecuritySeverity.MEDIUM,
        metadata: { reason: `Account state: ${user.accountState}` },
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });
      throw new ForbiddenException({
        message:
          user.accountState === AccountState.PENDING_VERIFICATION
            ? "Verify your email with the 5-digit code before signing in."
            : "Your account is unavailable. Please contact your administrator.",
        code:
          user.accountState === AccountState.PENDING_VERIFICATION
            ? "EMAIL_VERIFICATION_REQUIRED"
            : "ACCOUNT_UNAVAILABLE",
      });
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  private async checkAndLockAccount(userId: string, context?: any) {
    const lockoutThreshold = 5; // Should ideally come from SecurityPolicy
    const recentFailures = await this.prisma.securityEvent.count({
      where: {
        userId,
        eventType: 'LOGIN_FAILURE' as any,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 mins
      }
    });

    if (recentFailures >= lockoutThreshold) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { accountState: AccountState.LOCKED }
      });

      await this.securityEventService.logEvent({
        userId,
        eventType: SecurityEventType.ACCOUNT_LOCKED as any,
        severity: SecuritySeverity.HIGH,
        metadata: { reason: "Maximum login attempts exceeded" },
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });

      // Optional: Send security alert email
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
          await this.emailProvider.send({
              to: user.email,
              subject: "SchooMA Security Alert: Account Locked",
              body: "Your account has been locked due to multiple failed login attempts. Please reset your password or contact support to regain access."
          });
      }
    }
  }

  async login(user: any, context?: any) {
    return this.issueLoginOtp(user, context);
  }

  async resendLoginOtp(otpToken: string, context?: any) {
    const user = await this.resolveLoginOtpToken(otpToken);
    return this.issueLoginOtp(user, context);
  }

  async verifyLoginOtp(otpToken: string, code: string, context?: any) {
    const user = await this.resolveLoginOtpToken(otpToken);
    const verification = await this.emailOtp.verifyCode(
      user.id,
      'LOGIN',
      code,
      context,
    );

    if (!verification.valid) {
      if (verification.locked) {
        throw new UnauthorizedException(
          "Too many incorrect codes. Request a new sign-in code.",
        );
      }
      if (verification.expired) {
        throw new UnauthorizedException(
          "That code has expired. Request a new sign-in code.",
        );
      }
      throw new UnauthorizedException(
        "That code is incorrect. Check your email and try again.",
      );
    }

    return this.createAuthenticatedSession(user, context);
  }

  private async issueLoginOtp(user: any, context?: any) {
    const challenge = await this.emailOtp.issueChallenge(user.id, "LOGIN");
    const delivery = await this.emailOtp.sendLoginCode(user, challenge.code);

    return {
      otpRequired: true,
      otp_token: this.jwtService.sign(
        { sub: user.id, otp: true, purpose: "LOGIN_OTP" },
        { expiresIn: LOGIN_OTP_TOKEN_TTL },
      ),
      email: user.email,
      emailSent: delivery.emailSent,
      emailDelivery: delivery.emailDelivery,
      codeLength: OTP_CODE_LENGTH,
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    };
  }

  private async resolveLoginOtpToken(otpToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(otpToken);
    } catch {
      throw new UnauthorizedException(
        "Your sign-in session expired. Enter your password again.",
      );
    }

    if (!payload?.otp || payload.purpose !== "LOGIN_OTP" || !payload.sub) {
      throw new UnauthorizedException("Invalid sign-in challenge.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid sign-in challenge.");
    }

    const blockedStates: AccountState[] = [
      AccountState.DISABLED,
      AccountState.SUSPENDED,
      AccountState.LOCKED,
      AccountState.COMPROMISED,
      AccountState.PENDING_VERIFICATION,
    ];
    if (!user.isActive || blockedStates.includes(user.accountState)) {
      throw new ForbiddenException(
        "Your account is unavailable. Please contact your administrator.",
      );
    }

    return user;
  }

  async createAuthenticatedSession(user: any, context?: any) {
    const { score, severity } = await this.riskService.evaluateLoginRisk(
      user.id,
      context,
    );

    const { token, session } = await this.sessionService.createSession({
      userId: user.id,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      deviceId: context?.deviceId,
    });

    const userWithDetails = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: { include: { school: true } },
        userRoles: { include: { role: true } },
      },
    });

    const persistedRoles =
      userWithDetails?.userRoles.map((ur: any) => ur.role.name) || [];
    const resolvedRoles = expandRoleAliases(persistedRoles);

    const payload = {
      email: user.email,
      sub: user.id,
      sid: session.id,
      roles: resolvedRoles,
    };

    await this.securityEventService.logEvent({
      userId: user.id,
      sessionId: session.id,
      eventType: "LOGIN_SUCCESS",
      riskScore: score,
      severity,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      access_token: this.jwtService.sign(payload),
      session_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        memberships: userWithDetails?.memberships || [],
        userRoles: userWithDetails?.userRoles || [],
        roles: resolvedRoles,
        platformPermissions: platformPermissionsFor(resolvedRoles),
        schoolPermissions: schoolPermissionsFor(persistedRoles),
      },
    };
  }

  async verifyEmail(
    email: string,
    code: string,
    context?: { ip?: string; userAgent?: string },
  ) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !code) {
      throw new BadRequestException(
        "Enter the email address and 5-digit code we sent you.",
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.accountState !== AccountState.PENDING_VERIFICATION) {
      throw new BadRequestException("That code is invalid or has expired.");
    }

    const verification = await this.emailOtp.verifyCode(
      user.id,
      "EMAIL_VERIFICATION",
      code,
      context,
    );

    if (!verification.valid) {
      if (verification.locked) {
        throw new BadRequestException(
          "Too many incorrect codes. Request a new verification code.",
        );
      }
      if (verification.expired) {
        throw new BadRequestException(
          "That code has expired. Request a new verification code.",
        );
      }
      throw new BadRequestException(
        "That code is incorrect. Check your email and try again.",
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        accountState: AccountState.ACTIVE,
      },
    });

    await this.securityEventService.logEvent({
      userId: user.id,
      eventType: "LOGIN_SUCCESS" as any,
      severity: SecuritySeverity.LOW,
      metadata: { action: "EMAIL_VERIFIED" },
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return {
      success: true,
      message: "Email verified successfully. You can now sign in.",
    };
  }

  async resendVerificationEmail(email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException("Email address is required");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: { school: { select: { name: true } } },
          take: 1,
        },
      },
    });

    if (user && user.accountState === AccountState.PENDING_VERIFICATION) {
      const challenge = await this.emailOtp.issueChallenge(
        user.id,
        "EMAIL_VERIFICATION",
      );
      await this.emailOtp.sendVerificationCode(
        user,
        user.memberships[0]?.school?.name || "your school",
        challenge.code,
      );
    }

    return {
      message:
        "If an unverified account exists for this email, a new 5-digit code has been sent.",
      codeLength: OTP_CODE_LENGTH,
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException("Email address is required");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");

      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await this.securityEventService.logEvent({
        userId: user.id,
        eventType: SecurityEventType.PASSWORD_RESET_REQUESTED,
        severity: SecuritySeverity.LOW,
      });

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      await this.emailProvider.send({
        to: user.email,
        subject: "Reset your SchooMA Workspace Password",
        body: `Hello ${user.firstName || 'User'},\n\nA password reset request was received for your SchooMA account.\n\nPlease click the secure link below to establish new credentials:\n\n${resetUrl}\n\nThis security link will expire in 1 hour.\n\nIf you did not initiate this request, please ignore this email.`,
      });
    }

    return {
      message:
        "If an account exists, you will receive password reset instructions.",
    };
  }

  async resetPassword(token: string, newPass: string) {
    if (!token || !newPass) {
      throw new BadRequestException("Token and new password are required");
    }

    if (newPass.length < 12 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(newPass)) {
      throw new BadRequestException("Password must be at least 12 characters and contain uppercase, lowercase, number, and special character.");
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordHash = await argon2.hash(newPass, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });

      await tx.passwordResetToken.delete({ where: { id: resetRecord.id } });

      await this.securityEventService.logEvent({
        userId: resetRecord.userId,
        eventType: SecurityEventType.PASSWORD_CHANGED,
        severity: SecuritySeverity.MEDIUM,
        metadata: { action: "PASSWORD_RESET_COMPLETED" },
      });
    });

    return { success: true, message: "Password updated successfully." };
  }

  async getInvitationDetails(token: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const invite = await this.prisma.invitation.findUnique({
      where: { tokenHash },
      include: { school: true, role: true },
    });

    if (
      !invite ||
      invite.status !== InvitationStatus.PENDING ||
      invite.expiresAt < new Date()
    ) {
      throw new BadRequestException(
        "Invitation link is invalid or has expired",
      );
    }

    return invite;
  }

  async acceptInvitation(token: string, password: string) {
    const invite = await this.getInvitationDetails(token);

    // Enforce strong password rules
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password) || password.length < 12) {
      throw new BadRequestException("Password must be at least 12 characters and contain uppercase, lowercase, numbers and symbols.");
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    return this.prisma.$transaction(async (tx) => {
      // 1. Create or update user
      let user = await tx.user.findUnique({ where: { email: invite.email } });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: invite.email,
            passwordHash,
            firstName: "",
            lastName: "",
            accountState: AccountState.ACTIVE,
            emailVerified: new Date(),
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            accountState: AccountState.ACTIVE,
            emailVerified: user.emailVerified || new Date(),
            isActive: true,
          },
        });
      }

      // 2. Link Membership
      await tx.schoolMembership.upsert({
        where: {
          schoolId_userId: { schoolId: invite.schoolId, userId: user.id },
        },
        update: { status: "ACTIVE" },
        create: {
          schoolId: invite.schoolId,
          userId: user.id,
          status: "ACTIVE",
        },
      });

      // 3. Assign Role
      await tx.userRole.upsert({
        where: {
          userId_roleId_schoolId: {
            userId: user.id,
            roleId: invite.roleId,
            schoolId: invite.schoolId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: invite.roleId,
          schoolId: invite.schoolId,
        },
      });

      // 4. Mark invite accepted
      await tx.invitation.update({
        where: { id: invite.id },
        data: { status: InvitationStatus.ACCEPTED },
      });

      await this.securityEventService.logEvent({
        userId: user.id,
        eventType: "LOGIN_SUCCESS" as any,
        severity: SecuritySeverity.LOW,
        metadata: { action: "INVITE_ACCEPTED", schoolId: invite.schoolId },
      });

      return { success: true };
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            school: true,
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException();

    if (user.accountState === AccountState.DISABLED || user.accountState === AccountState.SUSPENDED) {
      throw new ForbiddenException('Account is disabled');
    }

    const { passwordHash, ...result } = user;
    const persistedRoles = result.userRoles.map((userRole: any) => userRole.role.name);
    const resolvedRoles = expandRoleAliases(persistedRoles);

    return {
      ...result,
      roles: resolvedRoles,
      platformPermissions: platformPermissionsFor(resolvedRoles),
      schoolPermissions: schoolPermissionsFor(persistedRoles),
    };
  }

  async bootstrapSuperAdmin(data: { email: string; password: string; firstName: string; lastName: string }) {
    const email = data.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Super admin email is required');
    }
    if (
      !data.password ||
      data.password.length < 12 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(data.password)
    ) {
      throw new BadRequestException(
        'Password must be at least 12 characters and contain uppercase, lowercase, number, and special character.',
      );
    }

    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      const user = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: {
              passwordHash,
              firstName: data.firstName || existing.firstName,
              lastName: data.lastName || existing.lastName,
              accountState: AccountState.ACTIVE,
              emailVerified: existing.emailVerified || new Date(),
              isActive: true,
            },
          })
        : await tx.user.create({
            data: {
              email,
              passwordHash,
              firstName: data.firstName,
              lastName: data.lastName,
              accountState: AccountState.ACTIVE,
              emailVerified: new Date(),
              isActive: true,
            },
          });

      const platformRoles = await provisionPlatformSuperAdmin(tx, user.id);

      // Preserve the legacy role for existing deployments and endpoints that
      // have not yet moved to the canonical platform role.
      const legacyRole = await tx.role.findFirst({
        where: { name: 'SUPER_ADMIN', schoolId: null },
      }) || await tx.role.create({
        data: {
          name: 'SUPER_ADMIN',
          description: 'Legacy platform super administrator alias',
          isSystem: true,
          schoolId: null,
        },
      });

      const legacyAssignment = await tx.userRole.findFirst({
        where: { userId: user.id, roleId: legacyRole.id, schoolId: null },
      });

      if (!legacyAssignment) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: legacyRole.id, schoolId: null },
        });
      }

      return {
        ...user,
        platformRoleId: platformRoles.PLATFORM_SUPER_ADMIN.id,
      };
    });
  }
}
