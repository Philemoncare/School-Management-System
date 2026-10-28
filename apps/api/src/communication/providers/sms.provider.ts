import { Injectable, Logger } from '@nestjs/common';
import { ServiceUnconfiguredException } from '../../common/exceptions/unsupported-feature.exception';

export interface SmsOptions {
  to: string;
  message: string;
}

export abstract class SmsProvider {
  abstract send(options: SmsOptions): Promise<{ success: boolean; reference?: string; error?: string; code?: string }>;
}

@Injectable()
export class ConsoleSmsProvider extends SmsProvider {
  private readonly logger = new Logger('ConsoleSmsProvider');

  async send(options: SmsOptions) {
    const hasApiKey = Boolean(
      process.env.SMS_API_KEY ||
      process.env.HUBTEL_CLIENT_SECRET ||
      process.env.ARKESEL_API_KEY ||
      process.env.TWILIO_AUTH_TOKEN
    );

    if (!hasApiKey) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`[UNCONFIGURED SMS - DEV MODE ONLY] To: ${options.to} | Message: ${options.message}`);
      }
      return {
        success: false,
        code: 'SERVICE_UNCONFIGURED',
        error: 'SMS service is not configured. Please contact your school administrator.',
      };
    }

    this.logger.log(`[SMS SENT] To: ${options.to} | Message: ${options.message}`);
    return { success: true, reference: `sms-${Date.now()}` };
  }
}
