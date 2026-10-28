import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      lazyConnect: true,
      retryStrategy: (times) => {
        return Math.min(times * 500, 5000);
      },
    });

    this.client.on('error', (err) => {
      // Gracefully log once or ignore connection errors when Redis is not running
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.client.status !== 'ready') return null;
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.client.status !== 'ready') return;
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // Ignore cache errors
    }
  }

  async ping(): Promise<string> {
    try {
      if (this.client.status !== 'ready') return 'down';
      return await this.client.ping();
    } catch (e) {
      return 'down';
    }
  }
}
