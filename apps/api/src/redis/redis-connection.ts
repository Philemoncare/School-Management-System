import { Logger } from '@nestjs/common';
import type { ConnectionOptions } from 'bullmq';

const logger = new Logger('Redis');

const REDIS_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'NR_CLOSED',
]);

/**
 * Redis/BullMQ connection settings shared by the API.
 *
 * `enableOfflineQueue` is disabled on purpose: when Redis is unavailable we
 * want queue writes to fail fast instead of hanging HTTP requests forever.
 * Blocking BullMQ connections require `maxRetriesPerRequest: null`.
 */
export function redisConnectionConfig(): ConnectionOptions {
  const rawUrl = process.env.REDIS_URL?.trim();
  const shared = {
    enableOfflineQueue: false,
    connectTimeout: 3_000,
    maxRetriesPerRequest: null as null,
    retryStrategy: (times: number) => Math.min(times * 1_000, 15_000),
  };

  if (rawUrl) {
    try {
      const url = new URL(rawUrl);
      return {
        host: url.hostname,
        port: url.port ? Number(url.port) : 6379,
        username: url.username ? decodeURIComponent(url.username) : undefined,
        password: url.password ? decodeURIComponent(url.password) : undefined,
        db:
          url.pathname && url.pathname !== '/'
            ? Number(url.pathname.slice(1))
            : undefined,
        tls: url.protocol === 'rediss:' ? {} : undefined,
        ...shared,
      };
    } catch {
      logger.warn(
        'REDIS_URL is not a valid connection URL; falling back to REDIS_HOST/REDIS_PORT.',
      );
    }
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    ...shared,
  };
}

/** True when an error means the Redis server cannot be reached. */
export function isRedisUnavailableError(error: unknown): boolean {
  const candidate = error as
    | { code?: string; message?: string; cause?: { code?: string } }
    | undefined;

  const code = candidate?.code ?? candidate?.cause?.code;
  if (code && REDIS_ERROR_CODES.has(code)) return true;

  const message = String(candidate?.message ?? '');
  return (
    /ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EHOSTUNREACH/i.test(message) ||
    /enableOfflineQueue|Stream isn't writeable|Connection is closed/i.test(message) ||
    /max retries per request/i.test(message)
  );
}

let lastWarningAt = 0;
const WARNING_INTERVAL_MS = 60_000;

/**
 * Log a single, throttled warning while Redis is down so a local development
 * run or a transient outage does not flood the console with retry noise.
 */
export function logRedisUnavailable(context: string): void {
  const now = Date.now();
  if (now - lastWarningAt < WARNING_INTERVAL_MS) return;
  lastWarningAt = now;
  logger.warn(
    `${context}: Redis is unreachable. Queue-backed features are degraded; ` +
      'the API continues to serve requests that do not require Redis.',
  );
}
