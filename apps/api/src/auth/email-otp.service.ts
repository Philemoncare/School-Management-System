import { Injectable, Logger } from '@nestjs/common';
import { SecurityEventType, SecuritySeverity } from '@prisma/client';
import { createHash, randomInt } from 'node:crypto';
import { EmailProvider } from '../communication/providers/email.provider';
import { SmsProvider } from '../communication/providers/sms.provider';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityEventService } from '../security/services/security-event.service';
import { OtpSmsThrottleService } from './otp-sms-throttle.service';

export type OtpPurpose = 'EMAIL_VERIFICATION' | 'LOGIN';
export type OtpDelivery = 'sent' | 'pending' | 'failed';
/** How a sign-in code reached the user. A code is only ever sent on one channel. */
export type OtpChannel = 'email' | 'sms';

export const OTP_CODE_LENGTH = 5;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const LOGIN_OTP_TOKEN_TTL = '10m';

/**
 * How long the API waits for a delivery confirmation before answering. Both
 * transports can legitimately take longer than a user should have to wait for a
 * sign-in screen, and 'pending' is the honest answer in that case.
 */
const DELIVERY_WAIT_MS = 4000;

export interface OtpChallenge {
  code: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface OtpSendResult {
  emailSent: boolean;
  emailDelivery: OtpDelivery;
}

export interface OtpSmsSendResult {
  smsSent: boolean;
  smsDelivery: OtpDelivery;
  /** Last digits of the destination, safe to show on a sign-in screen. */
  maskedTarget: string;
}

export interface OtpVerifyResult {
  valid: boolean;
  expired?: boolean;
  locked?: boolean;
}

interface OtpRecipient {
  id: string;
  email: string;
  phone?: string | null;
  firstName?: string | null;
}

/**
 * Owns the sign-in and verification code lifecycle: generation, hashed storage,
 * expiry, attempt lockout and delivery over email or SMS.
 *
 * The name and the `EmailVerificationToken` table predate the SMS channel. A
 * code is stored identically whichever way it is delivered, so an attempt made
 * against an SMS code counts toward the same lockout budget as an email one -
 * the SMS path is a delivery channel for the very same code, not a second
 * system.
 */
@Injectable()
export class EmailOtpService {
  private readonly logger = new Logger(EmailOtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
    private readonly smsThrottle: OtpSmsThrottleService,
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
      code,
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
      code,
    );
  }

  /** Whether an SMS code can reach this account at all. */
  canDeliverViaSms(user: Pick<OtpRecipient, 'phone'>): boolean {
    return Boolean((user.phone || '').trim());
  }

  /**
   * Sends the sign-in code as a text message.
   *
   * The per-number budget is reserved *before* the gateway is called, not after
   * it. Checking the limit and then recording the success would let a caller fire
   * dozens of parallel requests through the same empty window and get dozens of
   * texts, because none of them had recorded anything yet. Reserving up front
   * costs a small amount of precision - a rejected message still spends a slot -
   * in exchange for a ceiling the caller cannot race past.
   *
   * Kept to one GSM 7-bit segment (well under 160 characters) so one code never
   * costs two credits.
   */
  async sendLoginCodeViaSms(
    user: OtpRecipient,
    code: string,
    context?: { ip?: string },
  ): Promise<OtpSmsSendResult> {
    const phone = (user.phone || '').trim();
    const maskedTarget = this.maskPhone(phone);
    if (!phone) {
      return { smsSent: false, smsDelivery: 'failed', maskedTarget: '' };
    }

    this.smsThrottle.assertAllowed(phone, context?.ip);
    this.smsThrottle.recordSend(phone, context?.ip);

    const message = `SchooMA: your sign-in code is ${code}. It expires in 5 minutes. Do not share it.`;

    const deliveryPromise = this.smsProvider
      .send({ to: phone, message })
      .then((result) => (result.success ? 'sent' : 'failed') as OtpDelivery)
      .catch((error) => {
        this.logger.error(
          `Failed to send SMS sign-in code for user ${user.id} to ${maskedTarget}`,
          error instanceof Error ? error.stack : undefined,
        );
        return 'failed' as OtpDelivery;
      });

    let timeout: NodeJS.Timeout | undefined;
    const smsDelivery = await Promise.race<OtpDelivery>([
      deliveryPromise,
      new Promise<OtpDelivery>((resolve) => {
        timeout = setTimeout(() => resolve('pending'), DELIVERY_WAIT_MS);
      }),
    ]);
    if (timeout) clearTimeout(timeout);

    if (smsDelivery === 'pending') {
      this.logger.warn(
        `SMS sign-in code for user ${user.id} is still sending; response returned without waiting.`,
      );
    }

    // Same development escape hatch as the email path, and for the same reason:
    // a misconfigured sender ID or an unverified sandbox account must not lock a
    // developer out of their own app. Never print a live code in production.
    if (
      smsDelivery !== 'sent' &&
      process.env.NODE_ENV !== 'production'
    ) {
      this.logger.warn(
        `[DEVELOPMENT ONLY] SMS delivery for user ${user.id} was '${smsDelivery}'. OTP code: ${code}`,
      );
    }

    return { smsSent: smsDelivery === 'sent', smsDelivery, maskedTarget };
  }

  private async sendCode(
    user: OtpRecipient,
    subject: string,
    body: string,
    debugCode?: string,
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
        timeout = setTimeout(() => resolve('pending'), DELIVERY_WAIT_MS);
      }),
    ]);
    if (timeout) clearTimeout(timeout);

    if (emailDelivery === 'pending') {
      this.logger.warn(
        `OTP email to user ${user.id} is still sending; response returned without waiting.`,
      );
    }

    // Development convenience: when SMTP is misconfigured locally, surface the
    // code in the API console so a developer can still complete sign-in.
    // This must never run in production.
    if (
      emailDelivery !== 'sent' &&
      debugCode &&
      process.env.NODE_ENV !== 'production'
    ) {
      this.logger.warn(
        `[DEVELOPMENT ONLY] Email delivery failed for user ${user.id}. OTP code: ${debugCode}`,
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

  /**
   * Shows the user where the code went without putting a full phone number into
   * a response body, a browser state or an access log.
   */
  private maskPhone(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    return `••••${digits.slice(-4)}`;
  }
}
