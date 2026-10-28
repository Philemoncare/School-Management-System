import { Injectable, Logger } from '@nestjs/common';
import { SecurityEventType, SecuritySeverity } from '@prisma/client';
import { createHash, randomInt } from 'node:crypto';
import { EmailProvider } from '../communication/providers/email.provider';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityEventService } from '../security/services/security-event.service';

export type OtpPurpose = 'EMAIL_VERIFICATION' | 'LOGIN';
export type OtpDelivery = 'sent' | 'pending' | 'failed';

export const OTP_CODE_LENGTH = 5;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const LOGIN_OTP_TOKEN_TTL = '10m';

export interface OtpChallenge {
  code: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface OtpSendResult {
  emailSent: boolean;
  emailDelivery: OtpDelivery;
}

export interface OtpVerifyResult {
  valid: boolean;
  expired?: boolean;
  locked?: boolean;
}

interface OtpRecipient {
  id: string;
  email: string;
  firstName?: string | null;
}

@Injectable()
export class EmailOtpService {
  private readonly logger = new Logger(EmailOtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: EmailProvider,
    private readonly securityEvents: SecurityEventService,
  ) {}

  createChallenge(userId: string, purpose: OtpPurpose): OtpChallenge {
    const code = randomInt(0, 10 ** OTP_CODE_LENGTH)
      .toString()
      .padStart(OTP_CODE_LENGTH, '0');

    return {
      code,
      tokenHash: this.hashCode(userId, purpose, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    };
  }

  async issueChallenge(userId: string, purpose: OtpPurpose): Promise<OtpChallenge> {
    const challenge = this.createChallenge(userId, purpose);

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: challenge.tokenHash,
          expiresAt: challenge.expiresAt,
        },
      }),
    ]);

    return challenge;
  }

  async verifyCode(
    userId: string,
    purpose: OtpPurpose,
    code: string,
    context?: { ip?: string; userAgent?: string },
  ): Promise<OtpVerifyResult> {
    const normalizedCode = typeof code === 'string' ? code.trim() : '';
    if (!new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`).test(normalizedCode)) {
      await this.recordFailure(userId, purpose, context);
      return { valid: false };
    }

    const record = await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      await this.recordFailure(userId, purpose, context);
      return { valid: false };
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.prisma.emailVerificationToken.deleteMany({ where: { userId } });
      return { valid: false, expired: true };
    }

    const expected = record.tokenHash;
    const actual = this.hashCode(userId, purpose, normalizedCode);
    let difference = expected.length ^ actual.length;
    for (let index = 0; index < expected.length; index += 1) {
      difference |= expected.charCodeAt(index) ^ (actual.charCodeAt(index) || 0);
    }
    const matches = difference === 0;

    if (!matches) {
      const failures = await this.recordFailure(userId, purpose, context);
      if (failures >= OTP_MAX_ATTEMPTS) {
        await this.prisma.emailVerificationToken.deleteMany({ where: { userId } });
        return { valid: false, locked: true };
      }
      return { valid: false };
    }

    await this.prisma.emailVerificationToken.deleteMany({ where: { userId } });
    return { valid: true };
  }

  async sendVerificationCode(
    user: OtpRecipient,
    schoolName: string,
    code: string,
  ): Promise<OtpSendResult> {
    return this.sendCode(
      user,
      'Verify your SchooMA account',
      `Hello ${user.firstName || 'there'},

Your school, ${schoolName}, is ready on SchooMA.

Enter this ${OTP_CODE_LENGTH}-digit code to verify your administrator email:

${code}

This code expires in 5 minutes. Do not share it with anyone.

If you did not create this workspace, you can ignore this email.`,
    );
  }

  async sendLoginCode(user: OtpRecipient, code: string): Promise<OtpSendResult> {
    return this.sendCode(
      user,
      'Your SchooMA sign-in code',
      `Hello ${user.firstName || 'there'},

Use this ${OTP_CODE_LENGTH}-digit code to finish signing in to SchooMA:

${code}

This code expires in 5 minutes. Do not share it with anyone.

If you did not try to sign in, change your password immediately.`,
    );
  }

  private async sendCode(
    user: OtpRecipient,
    subject: string,
    body: string,
  ): Promise<OtpSendResult> {
    const deliveryPromise = this.emailProvider
      .send({ to: user.email, subject, body })
      .then((result) => (result.success ? 'sent' : 'failed') as OtpDelivery)
      .catch((error) => {
        this.logger.error(
          `Failed to send OTP email to ${user.email}`,
          error instanceof Error ? error.stack : undefined,
        );
        return 'failed' as OtpDelivery;
      });

    let timeout: NodeJS.Timeout | undefined;
    const emailDelivery = await Promise.race<OtpDelivery>([
      deliveryPromise,
      new Promise<OtpDelivery>((resolve) => {
        timeout = setTimeout(() => resolve('pending'), 4000);
      }),
    ]);
    if (timeout) clearTimeout(timeout);

    if (emailDelivery === 'pending') {
      this.logger.warn(
        `OTP email to user ${user.id} is still sending; response returned without waiting.`,
      );
    }

    return {
      emailSent: emailDelivery === 'sent',
      emailDelivery,
    };
  }

  private async recordFailure(
    userId: string,
    purpose: OtpPurpose,
    context?: { ip?: string; userAgent?: string },
  ): Promise<number> {
    await this.securityEvents.logEvent({
      userId,
      eventType: SecurityEventType.MFA_VERIFICATION_FAILED,
      severity: SecuritySeverity.MEDIUM,
      metadata: { action: `EMAIL_OTP_FAILED_${purpose}` },
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
    });

    return this.prisma.securityEvent.count({
      where: {
        userId,
        eventType: SecurityEventType.MFA_VERIFICATION_FAILED,
        createdAt: { gte: new Date(Date.now() - OTP_TTL_MS) },
        metadata: {
          path: ['action'],
          equals: `EMAIL_OTP_FAILED_${purpose}`,
        },
      },
    });
  }

  private hashCode(userId: string, purpose: OtpPurpose, code: string): string {
    return createHash('sha256')
      .update(`${purpose}:${userId}:${code}`)
      .digest('hex');
  }
}
