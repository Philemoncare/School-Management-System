import { Injectable, Logger } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export abstract class EmailProvider {
  abstract send(options: EmailOptions): Promise<{ success: boolean; reference?: string; error?: string }>;
}

@Injectable()
export class ConsoleEmailProvider extends EmailProvider {
  private readonly logger = new Logger('ConsoleEmailProvider');

  async send(options: EmailOptions) {
    this.logger.log(`[SIMULATED EMAIL] To: ${options.to} | Subject: ${options.subject}`);
    this.logger.debug(`Body: ${options.body}`);
    return { success: true, reference: `sim-${Date.now()}` };
  }
}
