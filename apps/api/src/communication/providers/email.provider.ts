import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export abstract class EmailProvider {
  abstract send(options: EmailOptions): Promise<{ success: boolean; reference?: string; error?: string; code?: string }>;
}

@Injectable()
export class ConsoleEmailProvider extends EmailProvider {
  private readonly logger = new Logger('ConsoleEmailProvider');

  async send(options: EmailOptions) {
    const hasSmtp = Boolean(
      process.env.SMTP_HOST || process.env.MAIL_HOST || process.env.RESEND_API_KEY
    );

    if (!hasSmtp && process.env.NODE_ENV !== 'development') {
      return {
        success: false,
        code: 'SERVICE_UNCONFIGURED',
        error: 'Email service is not configured. Please contact your school administrator.',
      };
    }

    this.logger.log(`[EMAIL LOG] To: ${options.to} | Subject: ${options.subject}`);
    return { success: true, reference: `email-log-${Date.now()}` };
  }
}

@Injectable()
export class SmtpEmailProvider extends EmailProvider {
  private readonly logger = new Logger('SmtpEmailProvider');
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor() {
    super();
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST || '';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    this.from = process.env.EMAIL_FROM || user;

    if (host && (user || process.env.NODE_ENV === 'development')) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: user && pass ? { user, pass } : undefined,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 12000,
      });
    } else {
      this.transporter = null;
    }
  }

  async send(options: EmailOptions) {
    if (!this.transporter || !this.from) {
      this.logger.warn('SMTP transport or EMAIL_FROM is not configured');
      return {
        success: false,
        code: 'SERVICE_UNCONFIGURED',
        error: 'Email (SMTP) service has not been configured. Please contact your administrator.',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        text: options.body,
      });

      return { success: true, reference: info.messageId };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return {
        success: false,
        code: 'SERVICE_UNAVAILABLE',
        error: 'Failed to send email. The email service may be temporarily unavailable.',
      };
    }
  }

  async verify() {
    if (!this.transporter) return false;
    return this.transporter.verify();
  }
}
