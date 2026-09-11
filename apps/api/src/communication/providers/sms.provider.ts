import { Injectable, Logger } from '@nestjs/common';

export interface SmsOptions {
  to: string;
  message: string;
}

export abstract class SmsProvider {
  abstract send(options: SmsOptions): Promise<{ success: boolean; reference?: string; error?: string }>;
}

@Injectable()
export class ConsoleSmsProvider extends SmsProvider {
  private readonly logger = new Logger('ConsoleSmsProvider');

  async send(options: SmsOptions) {
    this.logger.log(`[SIMULATED SMS] To: ${options.to} | Message: ${options.message}`);
    return { success: true, reference: `sim-sms-${Date.now()}` };
  }
}
