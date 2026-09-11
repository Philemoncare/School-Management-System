import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin/monitoring')
export class SuperAdminMonitoringController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('health')
  async getHealth() {
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
        storage: 'operational', // Mock for now, would check Minio/S3
        email: 'operational',
        sms: 'operational',
      },
      infrastructure: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      }
    };
  }

  @Get('queues')
  async getQueueStatus() {
    // BullMQ monitoring logic would go here
    return {
      notifications: { waiting: 0, active: 0, failed: 0 },
      emails: { waiting: 0, active: 0, failed: 0 },
    };
  }
}
