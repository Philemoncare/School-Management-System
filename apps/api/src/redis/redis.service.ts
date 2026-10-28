import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import {
  logRedisUnavailable,
  redisConnectionConfig,
} from './redis-connection';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private available = false;

  onModuleInit() {
    this.client = new Redis({
      ...redisConnectionConfig(),
      // Cache operations must never block a request when Redis is offline.
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    this.client.on('error', () => {
      if (this.available) {
        this.available = false;
        this.logger.warn('Redis connection lost; cache is unavailable.');
      }
      logRedisUnavailable('Cache');
    });

    this.client.on('ready', () => {
      this.available = true;
      this.logger.log('Redis connected successfully');
    });

    this.client.on('end', () => {
      this.available = false;
    });

    // Connect in the background so a missing Redis never blocks boot.
    this.client.connect().catch(() => {
      logRedisUnavailable('Cache');
    });
  }

  async onModuleDestroy() {
    if (!this.client) return;
    if (this.client.status === 'wait' || this.client.status === 'end') {
      this.client.disconnect();
      return;
    }
    await this.client.quit().catch(() => {
      this.client.disconnect();
    });
  }

  getClient(): Redis {
    return this.client;
  }

  isAvailable(): boolean {
    return this.available && this.client?.status === 'ready';
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isAvailable()) return null;
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (!this.isAvailable()) return;
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // Ignore cache errors; the source of truth is the database.
    }
  }

  async del(...keys: string[]): Promise<void> {
    try {
      if (!this.isAvailable() || keys.length === 0) return;
      await this.client.del(...keys);
    } catch {
      // Ignore cache errors.
    }
  }

  /** Delete every cache entry matching a glob pattern (best effort). */
  async delByPattern(pattern: string): Promise<void> {
    try {
      if (!this.isAvailable()) return;
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          200,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Ignore cache errors.
    }
  }

  async ping(): Promise<string> {
    try {
      if (!this.isAvailable()) return 'down';
      return await this.client.ping();
    } catch {
      return 'down';
    }
  }
}
