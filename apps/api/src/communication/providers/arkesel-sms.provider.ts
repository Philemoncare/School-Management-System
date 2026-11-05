import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SmsOptions, SmsSendResult, SmsBalanceResult } from './sms.provider';
import {
  ArkeselConfig,
  arkeselConfigError,
  resolveArkeselConfig,
  toMsisdn as normalizeMsisdn,
} from '../../common/utils/sms-gateway';

/**
 * Arkesel SMS gateway (https://sms.arkesel.com).
 *
 * Sends use the v2 REST endpoint, which authenticates through an `api-key`
 * header and takes a JSON body. The legacy `sms/api?action=send-sms` GET form
 * is deliberately not used: it puts the credential and the message text in the
 * URL, where proxy and web-server access logs would retain both.
 *
 * Balance reads use the legacy `action=check-balance` endpoint because Arkesel
 * currently answers no v2 balance route (both /api/v2/wallet/balance and
 * /api/v2/sms/balance return 404), and that endpoint has no header-auth variant.
 *
 * Failures are returned, never thrown. A POST that times out is ambiguous —
 * Arkesel may already have queued the message — and BullMQ would retry it,
 * which would send the parent a second SMS and charge the school twice. Leaving
 * the delivery FAILED lets an operator resend deliberately instead.
 */
@Injectable()
export class ArkeselSmsProvider extends SmsProvider {
  private readonly logger = new Logger('ArkeselSmsProvider');

  private config(): ArkeselConfig {
    return resolveArkeselConfig();
  }

  /**
   * Converts a stored phone number to the MSISDN Arkesel expects. The
   * implementation lives in `common/utils/sms-gateway` because the sign-in code
   * limiter must key its counters on the exact same canonical destination.
   */
  static toMsisdn(input: string, countryCode: string): string | null {
    return normalizeMsisdn(input, countryCode);
  }

  async send(options: SmsOptions): Promise<SmsSendResult> {
    const config = this.config();

    const configError = arkeselConfigError(config);
    if (configError) {
      return { success: false, accepted: false, code: 'SERVICE_UNCONFIGURED', error: configError };
    }

    const message = (options.message || '').trim();
    if (!message) {
      return {
        success: false,
        accepted: false,
        code: 'INVALID_REQUEST',
        error: 'The message body is empty. Nothing was sent.',
      };
    }

    const recipient = ArkeselSmsProvider.toMsisdn(options.to, config.countryCode);
    if (!recipient) {
      return {
        success: false,
        accepted: false,
        code: 'INVALID_PHONE_NUMBER',
        error: config.countryCode
          ? `${options.to} is not a valid phone number for the configured country code ${config.countryCode}. Store it in international format, e.g. +${config.countryCode}XXXXXXXXX.`
          : `${options.to} has no country code. Store it in international format (e.g. +233201234567) or set ARKESEL_DEFAULT_COUNTRY_CODE.`,
      };
    }

    let response: Response;
    let rawBody = '';
    try {
      response = await fetch(`${config.baseUrl}/api/v2/sms/send`, {
        method: 'POST',
        headers: {
          'api-key': config.apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ sender: config.senderId, message, recipients: [recipient] }),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
      rawBody = await response.text();
    } catch (error: any) {
      const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
      this.logger.error(
        `Arkesel request failed for ${recipient}: ${error?.message || 'unknown error'} (key from ${config.keySource})`,
      );
      return {
        success: false,
        accepted: false,
        code: 'SERVICE_UNAVAILABLE',
        error: timedOut
          ? 'The Arkesel gateway did not respond in time. The message may or may not have been queued; verify the recipient before resending.'
          : 'The Arkesel SMS gateway could not be reached. No delivery confirmation was received.',
      };
    }

    const payload = this.parseJson(rawBody);
    // Arkesel answers HTTP 200 with a JSON envelope, so the body status is the
    // authority; some error responses arrive 4xx with status "error".
    const bodyStatus = payload?.status ? String(payload.status).toLowerCase() : '';
    const rejectedByBody = bodyStatus && bodyStatus !== 'success';

    if (response.ok && !rejectedByBody) {
      const reference = ArkeselSmsProvider.referenceFrom(payload);
      const credits = ArkeselSmsProvider.creditsFrom(payload) || 1;
      this.logger.log(
        `Arkesel accepted SMS to ${recipient} (${credits} credit${credits === 1 ? '' : 's'}, ref ${reference || 'none'})`,
      );
      return {
        success: true,
        // Provider acceptance only. The processor records SENT, never DELIVERED.
        accepted: true,
        reference: reference || undefined,
      };
    }

    const code = ArkeselSmsProvider.errorCodeFor(response.status, payload);
    const detail = ArkeselSmsProvider.detailFrom(payload) || rawBody.slice(0, 200);
    this.logger.error(
      `Arkesel rejected SMS to ${recipient}: HTTP ${response.status} ${code} ${detail}`,
    );
    return {
      success: false,
      accepted: false,
      code,
      error: `Arkesel did not accept the message (HTTP ${response.status}): ${detail || code}. No delivery was made.`,
    };
  }

  /**
   * Platform-level Arkesel wallet balance. This is the credits SchooMA itself
   * bought from Arkesel, not any individual school's credit balance; it is only
   * ever exposed to platform staff.
   */
  async getBalance(): Promise<SmsBalanceResult> {
    const config = this.config();
    if (!config.apiKey) {
      return { configured: false, error: 'No Arkesel API key is configured for this deployment.' };
    }

    try {
      const response = await fetch(
        `${config.baseUrl}/sms/api?action=check-balance&api_key=${encodeURIComponent(config.apiKey)}&response=json`,
        { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(config.timeoutMs) },
      );
      const raw = await response.text();
      if (!response.ok) {
        return {
          configured: true,
          error: `Arkesel balance request failed (HTTP ${response.status}).`,
        };
      }
      const payload = this.parseJson(raw);
      if (!payload || typeof payload.balance === 'undefined') {
        return { configured: true, error: 'Arkesel returned no balance in its response.' };
      }
      return {
        configured: true,
        balance: Number(payload.balance),
        accountName: payload.user || undefined,
        country: payload.country || undefined,
        keySource: config.keySource,
      };
    } catch (error: any) {
      return {
        configured: true,
        error: `Arkesel balance is unreachable: ${error?.message || 'unknown error'}`,
      };
    }
  }

  private parseJson(raw: string): any | null {
    try {
      return JSON.parse(raw);
    } catch {
      // Arkesel has been observed returning an empty body with an HTTP error.
      return null;
    }
  }

  /** Field naming differs across Arkesel API versions, so accept the known set. */
  private static referenceFrom(payload: any): string {
    const data = payload?.data ?? {};
    const candidates = [
      data?.messageId,
      data?.message_id,
      data?.requestId,
      data?.requestIdHash,
      payload?.messageId,
      payload?.id,
    ];
    const found = candidates.find((value) => value !== undefined && value !== null && `${value}`.trim() !== '');
    return found === undefined ? '' : `${found}`;
  }

  private static creditsFrom(payload: any): number {
    const data = payload?.data ?? {};
    const value = data?.totalCreditCost ?? data?.credits ?? payload?.credits ?? payload?.cost;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private static detailFrom(payload: any): string {
    const value = payload?.message ?? payload?.error ?? payload?.msg;
    if (typeof value === 'string') return value.trim();
    // Validation errors may arrive as { errors: { recipients: ["..."] } }.
    const errors = payload?.errors;
    if (errors && typeof errors === 'object') {
      return Object.values(errors)
        .flat()
        .map((entry) => `${entry}`)
        .join('; ')
        .slice(0, 200);
    }
    return '';
  }

  private static errorCodeFor(status: number, payload: any): string {
    if (status === 401 || status === 403) {
      // 403 is Arkesel's answer for an unapproved/unknown sender ID, which is a
      // configuration fault rather than a bad message.
      return status === 401 ? 'PROVIDER_UNAUTHORIZED' : 'SENDER_NOT_APPROVED';
    }
    if (status === 422 || status === 400) return 'INVALID_REQUEST';
    if (status === 429) return 'RATE_LIMITED';
    if (status >= 500) return 'SERVICE_UNAVAILABLE';
    if (payload?.status && String(payload.status).toLowerCase() !== 'success') return 'PROVIDER_REJECTED';
    return 'PROVIDER_ERROR';
  }
}
