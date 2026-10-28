import { Injectable, Logger } from '@nestjs/common';
import { ServiceUnconfiguredException } from '../exceptions/unsupported-feature.exception';

export type IntegrationName = 'SMS' | 'EMAIL' | 'PAYMENTS' | 'STORAGE' | 'REDIS' | 'WHATSAPP';

export interface IntegrationCheckResult {
  service: IntegrationName;
  configured: boolean;
  provider: string;
  missingConfig: string[];
  message: string;
}

@Injectable()
export class IntegrationStatusService {
  private readonly logger = new Logger(IntegrationStatusService.name);

  checkSms(): IntegrationCheckResult {
    const provider = process.env.SMS_PROVIDER || 'Hubtel / Arkesel';
    const missing: string[] = [];

    const hasApiKey = Boolean(
      process.env.SMS_API_KEY ||
      process.env.HUBTEL_CLIENT_SECRET ||
      process.env.ARKESEL_API_KEY ||
      process.env.TWILIO_AUTH_TOKEN
    );

    if (!hasApiKey) {
      missing.push('SMS_API_KEY');
    }

    const configured = missing.length === 0;

    return {
      service: 'SMS',
      configured,
      provider,
      missingConfig: missing,
      message: configured
        ? 'SMS gateway is active and configured.'
        : 'SMS service is not configured. Please contact your school administrator.',
    };
  }

  checkEmail(): IntegrationCheckResult {
    const provider = process.env.EMAIL_PROVIDER || process.env.SMTP_HOST || 'Nodemailer / SMTP';
    const missing: string[] = [];

    const hasHost = Boolean(process.env.SMTP_HOST || process.env.MAIL_HOST || process.env.RESEND_API_KEY);
    if (!hasHost) {
      missing.push('SMTP_HOST');
    }

    const configured = missing.length === 0;

    return {
      service: 'EMAIL',
      configured,
      provider,
      missingConfig: missing,
      message: configured
        ? 'Email service is configured.'
        : 'Email (SMTP) service is not configured. Email notifications may be disabled.',
    };
  }

  checkPayments(): IntegrationCheckResult {
    const provider = process.env.PAYMENT_PROVIDER || 'Paystack / Flutterwave';
    const missing: string[] = [];

    const hasSecretKey = Boolean(
      process.env.PAYSTACK_SECRET_KEY ||
      process.env.FLUTTERWAVE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY
    );

    if (!hasSecretKey) {
      missing.push('PAYSTACK_SECRET_KEY');
    }

    const configured = missing.length === 0;

    return {
      service: 'PAYMENTS',
      configured,
      provider,
      missingConfig: missing,
      message: configured
        ? 'Payment gateway is active and configured.'
        : 'Online payment gateway is not configured. Contact your administrator to enable digital payments.',
    };
  }

  checkStorage(): IntegrationCheckResult {
    const provider = process.env.STORAGE_PROVIDER || 'Local Disk / S3';
    const missing: string[] = [];

    const isCloud = process.env.STORAGE_TYPE === 's3' || process.env.STORAGE_TYPE === 'cloudinary';
    if (isCloud) {
      if (!process.env.AWS_S3_BUCKET && !process.env.CLOUDINARY_URL) {
        missing.push('AWS_S3_BUCKET or CLOUDINARY_URL');
      }
    }

    const configured = missing.length === 0;

    return {
      service: 'STORAGE',
      configured,
      provider,
      missingConfig: missing,
      message: configured
        ? 'File storage is configured.'
        : 'Cloud file storage is not configured. Falling back to local storage.',
    };
  }

  checkRedis(): IntegrationCheckResult {
    const provider = 'Redis / BullMQ';
    const missing: string[] = [];

    const hasRedis = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);
    if (!hasRedis) {
      missing.push('REDIS_HOST');
    }

    const configured = missing.length === 0;

    return {
      service: 'REDIS',
      configured,
      provider,
      missingConfig: missing,
      message: configured
        ? 'Redis message queue is active.'
        : 'Redis queue is not configured. Background jobs will run synchronously.',
    };
  }

  checkWhatsApp(): IntegrationCheckResult {
    const provider = 'WhatsApp Business API';
    const missing: string[] = [];

    const hasToken = Boolean(process.env.WHATSAPP_API_TOKEN || process.env.META_WA_TOKEN);
    if (!hasToken) {
      missing.push('WHATSAPP_API_TOKEN');
    }

    const configured = missing.length === 0;

    return {
      service: 'WHATSAPP',
      configured,
      provider,
      missingConfig: missing,
      message: configured
        ? 'WhatsApp messaging service is active.'
        : 'WhatsApp integration is not configured.',
    };
  }

  getStatus(service: IntegrationName): IntegrationCheckResult {
    switch (service) {
      case 'SMS':
        return this.checkSms();
      case 'EMAIL':
        return this.checkEmail();
      case 'PAYMENTS':
        return this.checkPayments();
      case 'STORAGE':
        return this.checkStorage();
      case 'REDIS':
        return this.checkRedis();
      case 'WHATSAPP':
        return this.checkWhatsApp();
      default:
        return {
          service,
          configured: false,
          provider: 'Unknown',
          missingConfig: ['CONFIGURATION'],
          message: `Unknown service ${service}`,
        };
    }
  }

  getAllStatuses(): Record<IntegrationName, IntegrationCheckResult> {
    return {
      SMS: this.checkSms(),
      EMAIL: this.checkEmail(),
      PAYMENTS: this.checkPayments(),
      STORAGE: this.checkStorage(),
      REDIS: this.checkRedis(),
      WHATSAPP: this.checkWhatsApp(),
    };
  }

  assertConfigured(service: IntegrationName, featureName?: string): void {
    const status = this.getStatus(service);
    if (!status.configured) {
      this.logger.warn(
        `Attempted to use unconfigured integration '${service}' for feature '${featureName || 'unspecified'}'`,
      );
      throw new ServiceUnconfiguredException(
        service,
        status.message,
        status.missingConfig,
      );
    }
  }
}
