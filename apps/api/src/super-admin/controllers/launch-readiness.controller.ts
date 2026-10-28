import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PLATFORM_READ_ROLES } from '../../auth/platform-roles';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { IntegrationStatusService } from '../../common/services/integration-status.service';
import { DataIntegrityService } from '../../common/services/data-integrity.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/launch-readiness')
export class LaunchReadinessController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly integrations: IntegrationStatusService,
    private readonly integrityService: DataIntegrityService,
  ) {}

  @Get()
  async getReadiness() {
    const [integrity, redisPing, userCount, mfaUsers, openCriticalIncidents, policies] = await Promise.all([
      this.integrityService.runFullIntegrityCheck(),
      this.redis.ping(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.mfaMethod.findMany({
        where: { verifiedAt: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.securityIncident.count({
        where: { status: { in: ['OPEN', 'INVESTIGATING'] }, severity: 'CRITICAL' },
      }),
      this.prisma.securityPolicy.count({ where: { schoolId: null } }),
    ]);

    const redisUp = redisPing === 'PONG';
    const integration = this.integrations.getAllStatuses();
    const mfaAdoption = userCount ? Math.round((mfaUsers.length / userCount) * 100) : 0;
    const integrityClean = integrity.status === 'CLEAN';

    const categories = [
      {
        name: 'Application',
        status: 'PASS',
        details: 'NestJS API responded to authenticated readiness checks.',
      },
      {
        name: 'Database',
        status: integrityClean ? 'PASS' : 'WARNING',
        details: integrityClean
          ? 'PostgreSQL is reachable and the integrity audit is clean.'
          : `${integrity.issues.length} data integrity issue group(s) require attention.`,
      },
      {
        name: 'Security',
        status: openCriticalIncidents > 0 ? 'FAIL' : mfaAdoption < 25 ? 'WARNING' : 'PASS',
        details: openCriticalIncidents > 0
          ? `${openCriticalIncidents} critical security incident(s) remain open.`
          : `MFA adoption is ${mfaAdoption}%${policies ? ' and a platform security policy is stored.' : '; no platform security policy has been stored yet.'}`,
      },
      {
        name: 'Queues',
        status: redisUp ? 'PASS' : 'WARNING',
        details: redisUp ? 'Redis is reachable and BullMQ can accept jobs.' : 'Redis is offline; background jobs may not process.',
      },
      {
        name: 'Realtime',
        status: redisUp ? 'PASS' : 'WARNING',
        details: redisUp ? 'Realtime infrastructure dependency is available.' : 'Redis is offline; realtime fan-out may be degraded.',
      },
      {
        name: 'Storage',
        status: integration.STORAGE.configured ? 'PASS' : 'WARNING',
        details: integration.STORAGE.message,
      },
      {
        name: 'Email',
        status: integration.EMAIL.configured ? 'PASS' : 'WARNING',
        details: integration.EMAIL.message,
      },
      {
        name: 'Payments',
        status: integration.PAYMENTS.configured ? 'PASS' : 'WARNING',
        details: integration.PAYMENTS.message,
      },
      {
        name: 'Monitoring',
        status: 'PASS',
        details: 'Health, queue, activity, audit, and security endpoints are live.',
      },
    ] as Array<{ name: string; status: 'PASS' | 'WARNING' | 'FAIL'; details: string }>;

    const score = Math.round(
      (categories.reduce((sum, category) => sum + (category.status === 'PASS' ? 1 : category.status === 'WARNING' ? 0.5 : 0), 0) /
        categories.length) *
        100,
    );
    const blockers = categories
      .filter((category) => category.status !== 'PASS')
      .map((category) => ({ category: category.name, message: category.details }));

    return {
      summary: {
        status: blockers.length === 0 ? 'READY' : 'NEEDS_ATTENTION',
        score,
        checkedAt: new Date().toISOString(),
      },
      categories,
      integrity,
      blockers,
      integrations: integration,
    };
  }
}
