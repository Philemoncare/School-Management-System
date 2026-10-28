import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
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
    const status =
      dbStatus === 'down' ? 'error' : redisStatus === 'down' ? 'degraded' : 'ok';

    return {
      status,
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
