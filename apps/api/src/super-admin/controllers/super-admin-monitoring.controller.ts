import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { IntegrationStatusService } from '../../common/services/integration-status.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PLATFORM_READ_ROLES } from '../../auth/platform-roles';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/monitoring')
export class SuperAdminMonitoringController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly integrations: IntegrationStatusService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  private async withTimeout<T>(promise: Promise<T>, timeoutMs = 1500): Promise<T | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), timeoutMs);
        }),
      ]);
    } catch {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  @Get('health')
  async getHealth() {
    const startedAt = Date.now();
    let dbStatus = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'operational';
    } catch {
      dbStatus = 'down';
    }
    const databaseLatencyMs = Date.now() - startedAt;

    const redisPing = await this.redis.ping();
    const redisStatus = redisPing === 'PONG' ? 'operational' : 'down';
    const integration = this.integrations.getAllStatuses();

    return {
      status:
        dbStatus === 'operational' && redisStatus === 'operational'
          ? 'ok'
          : dbStatus === 'operational'
            ? 'degraded'
            : 'error',
      timestamp: new Date().toISOString(),
      services: {
        api: 'operational',
        database: dbStatus,
        redis: redisStatus,
        storage: integration.STORAGE.configured ? 'operational' : 'unconfigured',
        email: integration.EMAIL.configured ? 'operational' : 'unconfigured',
        sms: integration.SMS.configured ? 'operational' : 'unconfigured',
        payments: integration.PAYMENTS.configured ? 'operational' : 'unconfigured',
      },
      integrations: integration,
      databaseLatencyMs,
      infrastructure: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  @Get('queues')
  async getQueueStatus() {
    const redisPing = await this.redis.ping();
    if (redisPing !== 'PONG') {
      const [pending, failed, sent] = await Promise.all([
        this.prisma.notification.count({ where: { status: 'PENDING' } }),
        this.prisma.notification.count({ where: { status: 'FAILED' } }),
        this.prisma.notification.count({ where: { status: { in: ['SENT', 'DELIVERED'] } } }),
      ]);
      return {
        available: false,
        reason: 'Redis is not reachable; live queue counters are unavailable.',
        notifications: { waiting: pending, active: 0, completed: sent, failed, delayed: 0 },
      };
    }

    const counts = await this.withTimeout<any>(this.notificationQueue.getJobCounts());
    if (!counts) {
      return {
        available: false,
        reason: 'Queue metrics timed out.',
        notifications: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
      };
    }

    return {
      available: true,
      notifications: {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
      },
    };
  }

  @Get('activity')
  async getActivity() {
    const [failedDeliveries, recentAudit, recentSecurity] = await Promise.all([
      this.prisma.notificationDelivery.findMany({
        where: { status: 'FAILED' },
        take: 10,
        orderBy: { lastAttemptAt: 'desc' },
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              userId: true,
              school: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
      this.prisma.securityEvent.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
    ]);

    return { failedDeliveries, recentAudit, recentSecurity };
  }
}
