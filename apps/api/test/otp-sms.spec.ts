import { BadRequestException, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AuthService } from '../src/auth/auth.service';
import { EmailOtpService } from '../src/auth/email-otp.service';
import { OtpSmsThrottleService } from '../src/auth/otp-sms-throttle.service';

/**
 * Sign-in codes sent by text cost the platform real credits, so these tests
 * focus on the two things that make that safe: a limiter that cannot be raced
 * past, and reporting that never claims a message was sent when it was not.
 *
 * The gateway is always faked - a real Arkesel call would spend credits.
 */
const OTP_ENV_KEYS = [
  'NODE_ENV',
  'OTP_SMS_MAX_PER_NUMBER',
  'OTP_SMS_MAX_PER_IP',
  'OTP_SMS_MAX_TOTAL_PER_HOUR',
  'ARKESEL_DEFAULT_COUNTRY_CODE',
];

function withCleanEnv(overrides: Record<string, string>) {
  const saved: Record<string, string | undefined> = {};
  for (const key of OTP_ENV_KEYS) saved[key] = process.env[key];
  for (const key of OTP_ENV_KEYS) delete process.env[key];
  for (const [key, value] of Object.entries(overrides)) process.env[key] = value;
  return saved;
}

function restoreEnv(saved: Record<string, string | undefined>) {
  for (const key of OTP_ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

describe('OtpSmsThrottleService', () => {
  let saved: Record<string, string | undefined>;
  let throttle: OtpSmsThrottleService;

  function build(overrides: Record<string, string> = {}) {
    saved = withCleanEnv({
      NODE_ENV: 'production',
      OTP_SMS_MAX_PER_NUMBER: '2',
      OTP_SMS_MAX_PER_IP: '5',
      OTP_SMS_MAX_TOTAL_PER_HOUR: '100',
      ...overrides,
    });
    throttle = new OtpSmsThrottleService();
    return throttle;
  }

  afterEach(() => {
    if (throttle) throttle.onModuleDestroy();
    if (saved) restoreEnv(saved);
    saved = undefined;
    throttle = undefined;
  });

  it('permits exactly the configured number of sends, then blocks', () => {
    build();
    const phone = '0599811870';

    expect(() => throttle.assertAllowed(phone)).not.toThrow();
    throttle.recordSend(phone);
    expect(() => throttle.assertAllowed(phone)).not.toThrow();
    throttle.recordSend(phone);

    expect(() => throttle.assertAllowed(phone)).toThrow(ThrottlerException);
  });

  it('tells the caller to fall back to the email code when blocking', () => {
    build();
    throttle.recordSend('0599811870');
    throttle.recordSend('0599811870');

    let message = '';
    try {
      throttle.assertAllowed('0599811870');
    } catch (error) {
      message = (error as ThrottlerException).message;
    }
    expect(message).toMatch(/email/i);
  });

  it('counts one phone once whatever format it is written in', () => {
    build({ OTP_SMS_MAX_PER_NUMBER: '1', ARKESEL_DEFAULT_COUNTRY_CODE: '233' });

    // All three are the same Ghanaian subscriber number. Without normalization
    // an attacker could triple the budget by rotating the format.
    throttle.recordSend('0599811870');
    expect(() => throttle.assertAllowed('+233 59 981 1870')).toThrow(ThrottlerException);
    expect(() => throttle.assertAllowed('233599811870')).toThrow(ThrottlerException);
  });

  it('caps a source IP across different numbers', () => {
    build({ OTP_SMS_MAX_PER_NUMBER: '10', OTP_SMS_MAX_PER_IP: '1' });

    throttle.recordSend('0599811870', '203.0.113.9');
    expect(() => throttle.assertAllowed('0240000001', '203.0.113.9')).toThrow(
      ThrottlerException,
    );
    // A different caller is unaffected.
    expect(() => throttle.assertAllowed('0240000001', '198.51.100.4')).not.toThrow();
  });

  it('stops every number once the hourly total is spent', () => {
    build({ OTP_SMS_MAX_PER_NUMBER: '10', OTP_SMS_MAX_TOTAL_PER_HOUR: '2' });

    throttle.recordSend('0599811870');
    throttle.recordSend('0240000001');

    expect(() => throttle.assertAllowed('0545930837')).toThrow(ThrottlerException);
  });

  it('keeps separate budgets for separate numbers', () => {
    build({ OTP_SMS_MAX_PER_NUMBER: '1' });

    throttle.recordSend('0599811870');
    expect(() => throttle.assertAllowed('0240000001')).not.toThrow();
  });
});

describe('EmailOtpService SMS channel', () => {
  let saved: Record<string, string | undefined>;
  let smsProvider: { send: jest.Mock };
  let smsThrottle: { assertAllowed: jest.Mock; recordSend: jest.Mock };
  let service: EmailOtpService;

  function build(overrides: Record<string, string> = {}) {
    saved = withCleanEnv({
      NODE_ENV: 'production',
      OTP_SMS_MAX_PER_NUMBER: '3',
      OTP_SMS_MAX_PER_IP: '8',
      OTP_SMS_MAX_TOTAL_PER_HOUR: '300',
      ...overrides,
    });

    smsProvider = {
      send: jest.fn().mockResolvedValue({ success: true, accepted: true }),
    };
    smsThrottle = {
      assertAllowed: jest.fn(),
      recordSend: jest.fn(),
    };

    // Prisma, email and security events are untouched by the SMS path, so empty
    // doubles keep this test honest about what the method actually depends on.
    service = new EmailOtpService(
      {} as any,
      {} as any,
      smsProvider as any,
      smsThrottle as any,
      {} as any,
    );
    return service;
  }

  const user = { id: 'user-1', email: 'admin@school.edu.gh', phone: '0599811870' };

  afterEach(() => {
    if (saved) restoreEnv(saved);
    saved = undefined;
    jest.restoreAllMocks();
  });

  it('reports sent and names only the last digits of the destination', async () => {
    build();
    const result = await service.sendLoginCodeViaSms(user, '12345');

    expect(result.smsSent).toBe(true);
    expect(result.smsDelivery).toBe('sent');
    expect(result.maskedTarget.endsWith('1870')).toBe(true);
    // The full number must never travel back into the response body.
    expect(result.maskedTarget).not.toContain('599811870');
  });

  it('sends a single-segment message that carries the code', async () => {
    build();
    await service.sendLoginCodeViaSms(user, '42139');

    const sent = smsProvider.send.mock.calls[0][0];
    expect(sent.to).toBe('0599811870');
    expect(sent.message).toContain('42139');
    // GSM-7 basic is 160 characters per segment; anything longer doubles the cost.
    expect(sent.message.length).toBeLessThanOrEqual(160);
    // No UCS-2 characters: extended alphabet escapes still count as one septet,
    // but non-ASCII would silently risk a re-segmentation.
    expect(sent.message).toMatch(/^[\x00-\x7F]+$/);
  });

  it('never reports a refused message as sent', async () => {
    build();
    smsProvider.send.mockResolvedValue({
      success: false,
      accepted: false,
      code: 'SENDER_NOT_APPROVED',
    });

    const result = await service.sendLoginCodeViaSms(user, '12345');
    expect(result.smsSent).toBe(false);
    expect(result.smsDelivery).toBe('failed');
  });

  it('reserves the budget before the gateway is reached', async () => {
    build();
    const order: string[] = [];
    smsThrottle.assertAllowed.mockImplementation(() => order.push('assert'));
    smsThrottle.recordSend.mockImplementation(() => order.push('reserve'));
    smsProvider.send.mockImplementation(async () => {
      order.push('send');
      return { success: true, accepted: true };
    });

    await service.sendLoginCodeViaSms(user, '12345');
    expect(order).toEqual(['assert', 'reserve', 'send']);
  });

  it('does not reach the gateway once the limiter blocks', async () => {
    build();
    smsThrottle.assertAllowed.mockImplementation(() => {
      throw new ThrottlerException();
    });

    await expect(service.sendLoginCodeViaSms(user, '12345')).rejects.toThrow(
      ThrottlerException,
    );
    expect(smsProvider.send).not.toHaveBeenCalled();
    expect(smsThrottle.recordSend).not.toHaveBeenCalled();
  });

  it('fails without calling the gateway when the account has no phone', async () => {
    build();
    const result = await service.sendLoginCodeViaSms(
      { ...user, phone: '   ' },
      '12345',
    );

    expect(result.smsSent).toBe(false);
    expect(result.smsDelivery).toBe('failed');
    expect(result.maskedTarget).toBe('');
    expect(smsProvider.send).not.toHaveBeenCalled();
    expect(smsThrottle.assertAllowed).not.toHaveBeenCalled();
  });

  it('answers pending rather than inventing a delivery when the gateway stalls', async () => {
    build();
    smsProvider.send.mockImplementation(() => new Promise(() => {}));

    const result = await service.sendLoginCodeViaSms(user, '12345');
    expect(result.smsSent).toBe(false);
    expect(result.smsDelivery).toBe('pending');
  }, 20000);

  it('never prints a code to the log in production', async () => {
    build({ NODE_ENV: 'production' });
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    smsProvider.send.mockResolvedValue({ success: false, code: 'RATE_LIMITED' });

    await service.sendLoginCodeViaSms(user, '98765');

    const logged = warn.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(logged).not.toContain('98765');
  });

  it('prints the code when SMS delivery fails outside production', async () => {
    build({ NODE_ENV: 'development' });
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    smsProvider.send.mockResolvedValue({ success: false, code: 'SERVICE_UNCONFIGURED' });

    await service.sendLoginCodeViaSms(user, '98765');

    const logged = warn.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(logged).toContain('98765');
    expect(logged).toMatch(/DEVELOPMENT ONLY/);
  });

  it('reports whether an account can receive a text at all', () => {
    build();
    expect(service.canDeliverViaSms({ phone: '0599811870' })).toBe(true);
    expect(service.canDeliverViaSms({ phone: '  ' })).toBe(false);
    expect(service.canDeliverViaSms({ phone: null })).toBe(false);
    expect(service.canDeliverViaSms({})).toBe(false);
  });

  it('leaves the email path alone', async () => {
    build();
    const emailProvider = { send: jest.fn().mockResolvedValue({ success: true }) };
    const emailService = new EmailOtpService(
      {} as any,
      emailProvider as any,
      smsProvider as any,
      smsThrottle as any,
      {} as any,
    );

    const result = await emailService.sendLoginCode(user, '12345');

    expect(result).toEqual({ emailSent: true, emailDelivery: 'sent' });
    expect(smsProvider.send).not.toHaveBeenCalled();
    expect(smsThrottle.assertAllowed).not.toHaveBeenCalled();
  });
});

describe('AuthService sign-in channel', () => {
  const otpTokenUser = (phone: string | null) => ({
    id: 'user-1',
    email: 'admin@school.edu.gh',
    phone,
    firstName: 'Ada',
    isActive: true,
    accountState: 'ACTIVE',
  });

  function buildAuthService(user: any) {
    const emailOtp = {
      issueChallenge: jest.fn().mockResolvedValue({ code: '12345' }),
      sendLoginCode: jest
        .fn()
        .mockResolvedValue({ emailSent: true, emailDelivery: 'sent' }),
      sendLoginCodeViaSms: jest
        .fn()
        .mockResolvedValue({
          smsSent: true,
          smsDelivery: 'sent',
          maskedTarget: '••••1870',
        }),
      canDeliverViaSms: jest.fn((target: any) =>
        Boolean((target.phone || '').trim()),
      ),
    };

    const service = new AuthService(
      { user: { findUnique: async () => user } } as any,
      {
        verify: () => ({ otp: true, purpose: 'LOGIN_OTP', sub: user.id }),
        sign: () => 'fresh-otp-token',
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      emailOtp as any,
    );

    return { service, emailOtp };
  }

  it('sends the resent code by text and says the email was skipped', async () => {
    const { service, emailOtp } = buildAuthService(otpTokenUser('0599811870'));

    const result: any = await service.resendLoginOtp('token', { ip: '1.2.3.4' }, 'sms');

    expect(emailOtp.sendLoginCodeViaSms).toHaveBeenCalled();
    expect(emailOtp.sendLoginCode).not.toHaveBeenCalled();
    expect(result.channel).toBe('sms');
    expect(result.smsSent).toBe(true);
    expect(result.smsDelivery).toBe('sent');
    expect(result.maskedTarget).toBe('••••1870');
    // No email was attempted, so reporting 'failed' would invent a failure.
    expect(result.emailDelivery).toBe('skipped');
    expect(result.emailSent).toBe(false);
  });

  it('passes the caller IP so the per-IP ceiling can apply', async () => {
    const { service, emailOtp } = buildAuthService(otpTokenUser('0599811870'));

    await service.resendLoginOtp('token', { ip: '203.0.113.9' }, 'sms');

    const args = emailOtp.sendLoginCodeViaSms.mock.calls[0];
    expect(args[2]).toEqual({ ip: '203.0.113.9' });
  });

  it('refuses a text for an account with no phone without burning the code', async () => {
    const { service, emailOtp } = buildAuthService(otpTokenUser(null));

    await expect(
      service.resendLoginOtp('token', {}, 'sms'),
    ).rejects.toThrow(BadRequestException);

    // Issuing a challenge first would delete the working email code and replace
    // it with one nobody could deliver.
    expect(emailOtp.issueChallenge).not.toHaveBeenCalled();
    expect(emailOtp.sendLoginCodeViaSms).not.toHaveBeenCalled();
  });

  it('still defaults to email when no channel is asked for', async () => {
    const { service, emailOtp } = buildAuthService(otpTokenUser('0599811870'));

    const result: any = await service.resendLoginOtp('token', {});

    expect(emailOtp.sendLoginCode).toHaveBeenCalled();
    expect(emailOtp.sendLoginCodeViaSms).not.toHaveBeenCalled();
    expect(result.channel).toBe('email');
    expect(result.emailDelivery).toBe('sent');
    expect(result.smsDelivery).toBe('skipped');
    // The account does have a phone, so the UI may offer the switch.
    expect(result.canSwitchChannel).toBe(true);
  });
});
