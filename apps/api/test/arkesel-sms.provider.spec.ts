import { ArkeselSmsProvider } from '../src/communication/providers/arkesel-sms.provider';
import { resolveArkeselConfig } from '../src/common/utils/sms-gateway';

/**
 * The gateway is exercised only through a mocked fetch: a real call would spend
 * credits, and the response shapes below are the ones observed from Arkesel
 * (HTTP 200 JSON envelope for sends, {"balance":N,"user","country"} for the
 * legacy check-balance action, and Laravel-style {"message","status":"error"}
 * for validation failures).
 */
describe('ArkeselSmsProvider', () => {
  const SMS_ENV_KEYS = [
    'NODE_ENV',
    'ARKESEL_API_KEY',
    'ARKESEL_SANDBOX_API_KEY',
    'ARKESEL_SENDER_ID',
    'ARKESEL_DEFAULT_COUNTRY_CODE',
    'ARKESEL_BASE_URL',
    'SMS_API_KEY',
    'SMS_SENDER_ID',
    'SMS_DEFAULT_COUNTRY_CODE',
    'SMS_TIMEOUT_MS',
  ];
  const savedEnv: Record<string, string | undefined> = {};
  let fetchMock: jest.Mock;
  let originalFetch: unknown;

  beforeEach(() => {
    originalFetch = (global as any).fetch;
    for (const key of SMS_ENV_KEYS) savedEnv[key] = process.env[key];
    for (const key of SMS_ENV_KEYS) delete process.env[key];

    process.env.NODE_ENV = 'production';
    process.env.ARKESEL_API_KEY = 'test-api-key';
    process.env.ARKESEL_SENDER_ID = 'SCHOOLMA';
    process.env.ARKESEL_DEFAULT_COUNTRY_CODE = '233';

    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    for (const key of SMS_ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
    if (originalFetch === undefined) delete (global as any).fetch;
    else (global as any).fetch = originalFetch;
  });

  function jsonResponse(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    };
  }

  describe('toMsisdn', () => {
    it('keeps an international number and drops the plus', () => {
      expect(ArkeselSmsProvider.toMsisdn('+233200000003', '233')).toBe('233200000003');
    });

    it('expands a Ghana national number with the configured country code', () => {
      // Both formats really occur in the users/guardians tables.
      expect(ArkeselSmsProvider.toMsisdn('0599811870', '233')).toBe('233599811870');
      expect(ArkeselSmsProvider.toMsisdn('024 000 0001', '233')).toBe('233240000001');
    });

    it('strips an international 00 prefix', () => {
      expect(ArkeselSmsProvider.toMsisdn('00233201234567', '233')).toBe('233201234567');
    });

    it('refuses to guess a country for a national number when no code is set', () => {
      expect(ArkeselSmsProvider.toMsisdn('0599811870', '')).toBeNull();
    });

    it('rejects values that cannot be a phone number', () => {
      expect(ArkeselSmsProvider.toMsisdn('', '233')).toBeNull();
      expect(ArkeselSmsProvider.toMsisdn('not-a-phone', '233')).toBeNull();
      expect(ArkeselSmsProvider.toMsisdn('12345', '233')).toBeNull();
    });
  });

  describe('send', () => {
    it('posts to the v2 endpoint with header auth and never the key in the URL', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ status: 'success', message: 'ok', data: { messageId: 'msg-123' } }),
      );
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Fees due tomorrow' });

      expect(result).toEqual({ success: true, accepted: true, reference: 'msg-123' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://sms.arkesel.com/api/v2/sms/send');
      expect(init.method).toBe('POST');
      expect(init.headers['api-key']).toBe('test-api-key');
      expect(String(url)).not.toContain('test-api-key');
      expect(JSON.parse(init.body)).toEqual({
        sender: 'SCHOOLMA',
        message: 'Fees due tomorrow',
        recipients: ['233599811870'],
      });
    });

    it('does not send and reports unconfigured when the key is absent', async () => {
      delete process.env.ARKESEL_API_KEY;
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Hello' });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.accepted).toBe(false);
      expect(result.code).toBe('SERVICE_UNCONFIGURED');
      expect(result.error).toContain('ARKESEL_API_KEY');
    });

    it('does not send when the sender ID is missing', async () => {
      delete process.env.ARKESEL_SENDER_ID;
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Hello' });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.code).toBe('SERVICE_UNCONFIGURED');
      expect(result.error).toContain('ARKESEL_SENDER_ID');
    });

    it('rejects an unusable phone number before spending any credit', async () => {
      delete process.env.ARKESEL_DEFAULT_COUNTRY_CODE;
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Hello' });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.code).toBe('INVALID_PHONE_NUMBER');
    });

    it('rejects an empty message body', async () => {
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: '   ' });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.code).toBe('INVALID_REQUEST');
    });

    it('treats an HTTP 200 whose body says error as a failure', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ status: 'error', message: 'Invalid sender id' }, 200),
      );
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Hello' });

      expect(result.success).toBe(false);
      expect(result.accepted).toBe(false);
      expect(result.error).toContain('Invalid sender id');
    });

    it('maps 401 and 403 to distinct configuration faults', async () => {
      const provider = new ArkeselSmsProvider();

      fetchMock.mockResolvedValue(jsonResponse({ status: 'error', message: 'Unauthenticated' }, 401));
      expect((await provider.send({ to: '0599811870', message: 'Hi' })).code).toBe('PROVIDER_UNAUTHORIZED');

      fetchMock.mockResolvedValue(jsonResponse({ status: 'error', message: 'Sender not approved' }, 403));
      expect((await provider.send({ to: '0599811870', message: 'Hi' })).code).toBe('SENDER_NOT_APPROVED');
    });

    it('surfaces the validation message from a 422', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ message: 'The recipients field is required.', status: 'error' }, 422),
      );
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Hi' });

      expect(result.code).toBe('INVALID_REQUEST');
      expect(result.error).toContain('The recipients field is required.');
    });

    it('returns a failure instead of throwing when the gateway is unreachable', async () => {
      // Throwing would let BullMQ retry a POST whose outcome is unknown and
      // could deliver a duplicate SMS to the same parent.
      fetchMock.mockRejectedValue(Object.assign(new Error('fetch failed'), { name: 'TypeError' }));
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Hi' });

      expect(result.success).toBe(false);
      expect(result.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('reports a timeout as unconfirmed rather than accepted', async () => {
      fetchMock.mockRejectedValue(Object.assign(new Error('timed out'), { name: 'TimeoutError' }));
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Hi' });

      expect(result.code).toBe('SERVICE_UNAVAILABLE');
      expect(result.accepted).toBe(false);
      expect(result.error).toContain('may or may not have been queued');
    });

    it('uses the sandbox credential outside production so dev sends cannot spend live credits', async () => {
      process.env.NODE_ENV = 'development';
      process.env.ARKESEL_SANDBOX_API_KEY = 'sandbox-key';
      const provider = new ArkeselSmsProvider();
      fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: { messageId: 'm' } }));

      await provider.send({ to: '0599811870', message: 'Hi' });

      expect(fetchMock.mock.calls[0][1].headers['api-key']).toBe('sandbox-key');
      expect(resolveArkeselConfig().keySource).toBe('sandbox');
    });

    it('ignores the sandbox credential in production', async () => {
      process.env.ARKESEL_SANDBOX_API_KEY = 'sandbox-key';
      const provider = new ArkeselSmsProvider();
      fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: { messageId: 'm' } }));

      await provider.send({ to: '0599811870', message: 'Hi' });

      expect(fetchMock.mock.calls[0][1].headers['api-key']).toBe('test-api-key');
    });

    it('reads the message id from the alternative response shapes', async () => {
      const provider = new ArkeselSmsProvider();
      fetchMock.mockResolvedValue(jsonResponse({ status: 'success', data: { message_id: 'snake-case' } }));
      expect((await provider.send({ to: '0599811870', message: 'Hi' })).reference).toBe('snake-case');

      fetchMock.mockResolvedValue(jsonResponse({ status: 'success', messageId: 'top-level' }));
      expect((await provider.send({ to: '0599811870', message: 'Hi' })).reference).toBe('top-level');
    });

    it('still reports success when Arkesel sends no JSON body', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '' });
      const provider = new ArkeselSmsProvider();

      const result = await provider.send({ to: '0599811870', message: 'Hi' });

      expect(result.success).toBe(true);
      expect(result.reference).toBeUndefined();
    });
  });

  describe('getBalance', () => {
    it('parses the legacy check-balance payload', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ balance: 10, user: 'Melabah Philemon', country: 'Ghana' }),
      );
      const provider = new ArkeselSmsProvider();

      const balance = await provider.getBalance();

      expect(balance).toMatchObject({
        configured: true,
        balance: 10,
        accountName: 'Melabah Philemon',
        country: 'Ghana',
      });
    });

    it('reports a failure instead of a zero balance when the request fails', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'nope' }, 500));
      const provider = new ArkeselSmsProvider();

      const balance = await provider.getBalance();

      expect(balance.balance).toBeUndefined();
      expect(balance.error).toContain('HTTP 500');
    });

    it('reports unconfigured without calling the gateway', async () => {
      delete process.env.ARKESEL_API_KEY;
      const provider = new ArkeselSmsProvider();

      const balance = await provider.getBalance();

      expect(fetchMock).not.toHaveBeenCalled();
      expect(balance.configured).toBe(false);
    });
  });
});
