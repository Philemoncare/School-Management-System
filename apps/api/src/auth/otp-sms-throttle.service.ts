import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { resolveArkeselConfig, toMsisdn } from '../common/utils/sms-gateway';

interface LimitRule {
  key: string;
  limit: number;
  windowMs: number;
}

const WINDOW_MS = 10 * 60 * 1000;

/**
 * Bounds how much an unauthenticated caller can make the platform spend on
 * sign-in SMS codes.
 *
 * Unlike a school broadcast, an OTP is not billed to anyone: the platform pays
 * the gateway directly, so an attacker scripting this endpoint drains the
 * platform wallet rather than a tenant's balance. Three independent ceilings
 * apply - per phone number, per source IP, and a total hourly cap so a
 * distributed sweep cannot empty the wallet even if each key stays under its
 * own limit.
 *
 * Windows are held in this process's memory. That is correct for the current
 * single-API-instance deployment; a horizontally scaled deployment must move
 * these counters to Redis, or each instance gets its own budget and the limits
 * multiply by the instance count.
 */
@Injectable()
export class OtpSmsThrottleService implements OnModuleDestroy {
  private readonly logger = new Logger(OtpSmsThrottleService.name);
  private readonly hits = new Map<string, number[]>();
  private sweeper?: NodeJS.Timeout;

  private readonly perNumber: number;
  private readonly perIp: number;
  private readonly totalPerHour: number;

  constructor() {
    this.perNumber = Number(process.env.OTP_SMS_MAX_PER_NUMBER) || 3;
    this.perIp = Number(process.env.OTP_SMS_MAX_PER_IP) || 8;
    this.totalPerHour = Number(process.env.OTP_SMS_MAX_TOTAL_PER_HOUR) || 300;

    this.sweeper = setInterval(() => this.sweep(), WINDOW_MS);
    // Never keep the process alive for the cleanup timer alone.
    this.sweeper.unref?.();
  }

  onModuleDestroy() {
    if (this.sweeper) clearInterval(this.sweeper);
  }

  /** Throws 429 when any ceiling has already been reached. */
  assertAllowed(phone: string, ip?: string): void {
    for (const rule of this.rulesFor(phone, ip)) {
      if (this.count(rule) >= rule.limit) {
        this.logger.warn(
          `Blocked an SMS sign-in code by limit '${rule.key.split(':')[0]}' after ${rule.limit} sends in ${Math.round(rule.windowMs / 60000)} minutes.`,
        );
        throw new ThrottlerException(
          'Too many sign-in code requests. Please try again in a few minutes or sign in with your email code.',
        );
      }
    }
  }

  /**
   * Takes a slot from the budget. Called before the gateway is reached, not after
   * it succeeds, so parallel requests cannot all pass `assertAllowed` while the
   * window is still empty.
   */
  recordSend(phone: string, ip?: string): void {
    const now = Date.now();
    for (const rule of this.rulesFor(phone, ip)) {
      const list = this.hits.get(rule.key) ?? [];
      list.push(now);
      this.hits.set(rule.key, list);
    }
  }

  private rulesFor(phone: string, ip?: string): LimitRule[] {
    const rules: LimitRule[] = [
      { key: `number:${this.canonical(phone)}`, limit: this.perNumber, windowMs: WINDOW_MS },
      { key: 'total', limit: this.totalPerHour, windowMs: 60 * 60 * 1000 },
    ];
    if (ip) rules.push({ key: `ip:${ip}`, limit: this.perIp, windowMs: WINDOW_MS });
    return rules;
  }

  /**
   * Keys the per-number budget on the MSISDN the gateway will actually dial, so
   * `0599811870`, `+233 59 981 1870` and `233599811870` share one budget instead
   * of multiplying it. Numbers that cannot be normalized keep their raw form -
   * the provider refuses them, so no credit is ever spent on them.
   */
  private canonical(phone: string): string {
    const msisdn = toMsisdn(phone, resolveArkeselConfig().countryCode);
    return msisdn || (phone || '').trim();
  }

  private count(rule: LimitRule): number {
    const cutoff = Date.now() - rule.windowMs;
    const recent = (this.hits.get(rule.key) ?? []).filter((at) => at > cutoff);
    if (recent.length) this.hits.set(rule.key, recent);
    else this.hits.delete(rule.key);
    return recent.length;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, times] of this.hits) {
      const recent = times.filter((at) => now - at <= 60 * 60 * 1000);
      if (recent.length) this.hits.set(key, recent);
      else this.hits.delete(key);
    }
  }
}
