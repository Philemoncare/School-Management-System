import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SessionService } from "../security/services/session.service";
import { MfaService } from "../security/services/mfa.service";
import { SecurityRiskService } from "../security/services/security-risk.service";
import { SecurityEventService } from "../security/services/security-event.service";
import * as argon2 from "argon2";
import { randomBytes, createHash } from "node:crypto";
import {
  SecurityEventType,
  SecuritySeverity,
  AccountState,
  InvitationStatus,
} from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
    private readonly sessionService: SessionService,
    private readonly mfaService: MfaService,
    private readonly riskService: SecurityRiskService,
    private readonly securityEventService: SecurityEventService,
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

    if (!user) {
      return null;
    }

    const passwordMatches = await argon2
      .verify(user.passwordHash, pass)
      .catch(() => false);

    if (!passwordMatches) {
      await this.securityEventService.logEvent({
        userId: user.id,
        eventType: "LOGIN_FAILURE" as any,
        severity: SecuritySeverity.LOW,
        metadata: { reason: "Invalid password" },
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });
      return null;
    }

    const blockedStates = [
      AccountState.DISABLED,
      AccountState.SUSPENDED,
      AccountState.LOCKED,
      AccountState.COMPROMISED,
    ];

    if (blockedStates.includes(user.accountState)) {
      await this.securityEventService.logEvent({
        userId: user.id,
        eventType: "LOGIN_FAILURE" as any,
        severity: SecuritySeverity.MEDIUM,
        metadata: { reason: `Account state: ${user.accountState}` },
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });
      throw new ForbiddenException(
        "Your account is unavailable. Please contact your administrator.",
      );
    }

    const mfaEnabled = await this.mfaService.isMfaEnabled(user.id);
    const { passwordHash, ...result } = user;
    return { ...result, mfaRequired: mfaEnabled };
  }

  async login(user: any, context?: any) {
    if (user.mfaRequired) {
      // Create a short-lived token for MFA stage
      const mfaToken = this.jwtService.sign(
        { sub: user.id, mfa: true },
        { expiresIn: "5m" },
      );

      await this.securityEventService.logEvent({
        userId: user.id,
        eventType: SecurityEventType.LOGIN_MFA_REQUIRED as any,
        severity: SecuritySeverity.LOW,
        ipAddress: context?.ip,
        userAgent: context?.userAgent,
      });

      return {
        mfaRequired: true,
        mfa_token: mfaToken,
      };
    }

    return this.createAuthenticatedSession(user, context);
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

    const payload = {
      email: user.email,
      sub: user.id,
      sid: session.id,
      roles: userWithDetails?.userRoles.map((ur: any) => ur.role.name) || [],
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
      },
    };
  }

  async registerSchool(dto: any) {
    const { school, admin } = dto;

    // Check for duplicates
    const existingSchool = await this.prisma.school.findFirst({
      where: { OR: [{ code: school.code }, { slug: school.slug }] },
    });
    if (existingSchool)
      throw new ConflictException("School code or slug already exists");

    const existingUser = await this.prisma.user.findUnique({
      where: { email: admin.email },
    });
    if (existingUser) throw new ConflictException("Email already registered");

    const passwordHash = await argon2.hash(admin.password);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create School
      const newSchool = await tx.school.create({
        data: {
          name: school.name,
          code: school.code,
          slug: school.slug,
          email: school.email,
          phone: school.phone,
          address: school.address,
          timezone: school.timezone || "UTC",
          currency: school.currency || "USD",
          status: "TRIAL",
        },
      });

      // 2. Create Admin User
      const newUser = await tx.user.create({
        data: {
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          passwordHash,
          accountState: AccountState.PENDING_VERIFICATION,
        },
      });

      // 3. Create Role
      const adminRole = await tx.role.create({
        data: {
          name: "SCHOOL_ADMIN",
          schoolId: newSchool.id,
          isSystem: true,
        },
      });

      // 4. Create Membership & Role Assignment
      await tx.schoolMembership.create({
        data: {
          schoolId: newSchool.id,
          userId: newUser.id,
          status: "ACTIVE",
        },
      });

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: adminRole.id,
          schoolId: newSchool.id,
        },
      });

      // 5. Generate Verification Token
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");

      await tx.emailVerificationToken.create({
        data: {
          userId: newUser.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Email delivery is intentionally deferred to the configured email provider abstraction.

      return { school: newSchool, user: newUser, verificationToken: token };
    });
  }

  async verifyEmail(token: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: {
          emailVerified: new Date(),
          accountState: AccountState.ACTIVE,
        },
      });

      await tx.emailVerificationToken.delete({ where: { id: record.id } });

      await this.securityEventService.logEvent({
        userId: record.userId,
        eventType: "LOGIN_SUCCESS" as any,
        severity: SecuritySeverity.LOW,
        metadata: { action: "EMAIL_VERIFIED" },
      });

      return { success: true };
    });
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
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

      // A real delivery system should send the token via email here.
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

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordHash = await argon2.hash(newPass);

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
    const passwordHash = await argon2.hash(password);

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

    const { passwordHash, ...result } = user;
    return result;
  }
}
