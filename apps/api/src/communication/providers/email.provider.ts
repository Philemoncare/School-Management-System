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
  private transporter: nodemailer.Transporter | null;
  private fallbackTransporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly pass: string;

  constructor() {
    super();
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST || '';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    this.host = host;
    this.port = port;
    this.user = user;
    this.pass = pass;
    this.from = process.env.EMAIL_FROM || user;

    if (host && (user || process.env.NODE_ENV === 'development')) {
      this.transporter = this.createTransport(host, port, process.env.SMTP_SECURE === 'true' || port === 465);
      // Some networks block the STARTTLS port (587) but allow implicit TLS (465).
      // Build a fallback so sign-in codes are not lost to a blocked port.
      if (port !== 465) {
        this.fallbackTransporter = this.createTransport(host, 465, true);
      }
    } else {
      this.transporter = null;
    }
  }

  private createTransport(host: string, port: number, secure: boolean) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: this.user && this.pass ? { user: this.user, pass: this.pass } : undefined,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });
  }

  private isConnectionError(error: unknown): boolean {
    const code = (error as { code?: string } | undefined)?.code;
    return code === 'ECONNECTION' || code === 'ESOCKET' || code === 'ETIMEDOUT' || code === 'ECONNREFUSED';
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

    const mail = {
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.body,
    };

    try {
      const info = await this.transporter.sendMail(mail);
      return { success: true, reference: info.messageId };
    } catch (error) {
      if (this.fallbackTransporter && this.isConnectionError(error)) {
        try {
          const info = await this.fallbackTransporter.sendMail(mail);
          this.logger.warn(
            `SMTP port ${this.port} was unreachable; switched to secure port 465 for ${this.host}.`,
          );
          this.transporter = this.fallbackTransporter;
          this.fallbackTransporter = null;
          return { success: true, reference: info.messageId };
        } catch (fallbackError) {
          this.logger.error(
            `Failed to send email to ${options.to} on ports ${this.port} and 465: ${
              fallbackError instanceof Error ? fallbackError.message : 'unknown error'
            }`,
          );
          return {
            success: false,
            code: 'SERVICE_UNAVAILABLE',
            error: 'Failed to send email. The email service may be temporarily unavailable.',
          };
        }
      }

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
