/**
 * Arkesel SMS gateway (https://sms.arkesel.com) helpers.
 *
 * Configuration resolution is shared by the transport provider and
 * IntegrationStatusService so both resolve the very same values — the platform
 * must never report "SMS is configured" for a configuration the provider would
 * actually refuse to send with. Number normalization is shared with the sign-in
 * code limiter for the same reason: one destination, one canonical form.
 */

export interface ArkeselConfig {
  baseUrl: string;
  apiKey: string;
  /** Registered alphanumeric Sender ID or masked number. Required by Arkesel. */
  senderId: string;
  /**
   * Country code used to expand national-format numbers stored in the database
   * (Ghana is stored as 0599811870 as well as +233200000003). Empty means no
   * expansion is attempted and such numbers are rejected instead of guessed.
   */
  countryCode: string;
  timeoutMs: number;
  /** Which env var supplied the key, so logs can distinguish prod from dev. */
  keySource: 'production' | 'sandbox' | 'generic' | 'none';
}

const trim = (value: string | undefined): string => (value || '').trim();

export function resolveArkeselConfig(): ArkeselConfig {
  const sandboxKey = trim(process.env.ARKESEL_SANDBOX_API_KEY);
  const dedicatedKey = trim(process.env.ARKESEL_API_KEY);
  const genericKey = trim(process.env.SMS_API_KEY);
  const productionKey = dedicatedKey || genericKey;

  // Outside production the sandbox credential wins whenever it exists, so a
  // developer testing a broadcast can never spend the live account's credits.
  const useSandbox = process.env.NODE_ENV !== 'production' && Boolean(sandboxKey);
  const apiKey = useSandbox ? sandboxKey : productionKey;

  let keySource: ArkeselConfig['keySource'] = 'none';
  if (useSandbox) keySource = 'sandbox';
  else if (dedicatedKey) keySource = 'production';
  else if (genericKey) keySource = 'generic';

  return {
    baseUrl: (trim(process.env.ARKESEL_BASE_URL) || 'https://sms.arkesel.com').replace(/\/+$/, ''),
    apiKey,
    senderId: trim(process.env.ARKESEL_SENDER_ID) || trim(process.env.SMS_SENDER_ID),
    countryCode: trim(process.env.ARKESEL_DEFAULT_COUNTRY_CODE) || trim(process.env.SMS_DEFAULT_COUNTRY_CODE),
    timeoutMs: Number(trim(process.env.SMS_TIMEOUT_MS)) || 20000,
    keySource,
  };
}

/** Missing configuration keys, empty when the gateway is ready to send. */
export function arkeselConfigGaps(config: ArkeselConfig = resolveArkeselConfig()): string[] {
  const gaps: string[] = [];
  if (!config.apiKey) gaps.push('ARKESEL_API_KEY');
  if (!config.senderId) gaps.push('ARKESEL_SENDER_ID');
  return gaps;
}

/** Human-readable reason a send cannot happen, or null when it can. */
export function arkeselConfigError(config: ArkeselConfig = resolveArkeselConfig()): string | null {
  const gaps = arkeselConfigGaps(config);
  if (!gaps.length) return null;
  return `The Arkesel SMS gateway is not configured (missing ${gaps.join(', ')}). No message was sent and no credits were used.`;
}

/**
 * Converts a stored phone number to the MSISDN the gateway expects (country
 * code + subscriber number, no `+`). The database holds both `+233200000003`
 * and national `0599811870` formats, so national numbers are expanded only when
 * a default country code is configured; otherwise they are rejected rather than
 * guessed into the wrong country.
 *
 * Shared with the per-number send limiter so a limit is keyed on the destination
 * the carrier actually sees - otherwise the same phone could be written in three
 * formats and receive three times the budget.
 */
export function toMsisdn(input: string, countryCode: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  const isInternationalStyled = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return null;

  if (isInternationalStyled) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) {
    if (!countryCode) return null;
    const national = digits.slice(1);
    if (national.length < 6) return null;
    return `${countryCode.replace(/\D/g, '')}${national}`;
  }
  return digits;
}
