import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('health')
  async healthCheck() {
    let dbStatus = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'down';
    }

    const redisPing = await this.redis.ping();
    const redisStatus = redisPing === 'PONG' ? 'up' : 'down';

    return {
      status: (dbStatus === 'up' && redisStatus === 'up') ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: dbStatus,
        redis: redisStatus,
      },
      version: '1.0.0',
    };
  }
}
