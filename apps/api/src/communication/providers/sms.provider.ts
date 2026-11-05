import { Injectable, Logger } from '@nestjs/common';

export interface SmsOptions {
  to: string;
  message: string;
}

export interface SmsSendResult {
  success: boolean;
  reference?: string;
  error?: string;
  code?: string;
  /**
   * True only when a real provider has handed the message to the carrier.
   * Even then this is provider *acceptance*, not a confirmed delivery — the
   * final DELIVERED status must come from a provider delivery receipt.
   */
  accepted?: boolean;
}

/**
 * Platform-level view of the SMS provider's own wallet. This is NOT a school's
 * credit balance: schools are billed from `School.smsCreditBalance` through the
 * audited ledger in SmsService, while this is the pool of credits SchooMA bought
 * from the gateway operator.
 */
export interface SmsBalanceResult {
  configured: boolean;
  balance?: number;
  accountName?: string;
  country?: string;
  keySource?: string;
  error?: string;
}

export abstract class SmsProvider {
  abstract send(options: SmsOptions): Promise<SmsSendResult>;
  abstract getBalance(): Promise<SmsBalanceResult>;
}

/**
 * Fallback transport used when no real gateway is configured.
 *
 * It NEVER reports a successful send. Treating a "successful" console log as a
 * real delivery was previously fabricating DELIVERED statuses and silently
 * deducting SMS credits for messages that were never handed to any carrier.
 *
 * The live implementation is ArkeselSmsProvider, selected by
 * CommunicationModule when an Arkesel API key is present.
 */
@Injectable()
export class ConsoleSmsProvider extends SmsProvider {
  private readonly logger = new Logger('ConsoleSmsProvider');

  async send(options: SmsOptions): Promise<SmsSendResult> {
    if (process.env.NODE_ENV === 'development') {
      // Clearly-labelled dev preview only. This is NOT a delivery and must not
      // be recorded or reported as one.
      this.logger.warn(
        `[SMS DEV PREVIEW - NOT SENT] To: ${options.to} | Message: ${options.message}`,
      );
    } else {
      this.logger.warn(
        `[SMS NOT SENT] No SMS provider is configured for production sends to ${options.to}.`,
      );
    }

    return {
      success: false,
      accepted: false,
      code: 'SERVICE_UNCONFIGURED',
      error:
        'No SMS provider is configured yet. Messages are previewed only and were not delivered.',
    };
  }

  async getBalance(): Promise<SmsBalanceResult> {
    return {
      configured: false,
      error: 'No SMS provider is configured for this deployment.',
    };
  }
}
