import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication')
export class CommunicationController {
  constructor(
    private readonly commsService: CommunicationService,
    private readonly prisma: PrismaService,
  ) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('templates')
  async getTemplates(@ActiveSchool() schoolId: string) {
    return this.prisma.notificationTemplate.findMany({
      where: {
        OR: [{ schoolId }, { schoolId: null }],
      },
    });
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('delivery-logs')
  async getDeliveryLogs(@ActiveSchool() schoolId: string, @Query('notificationId') notificationId?: string) {
    return this.prisma.notificationDelivery.findMany({
      where: {
        notification: {
          schoolId,
          id: notificationId,
        },
      },
      include: {
        notification: true,
      },
      orderBy: { lastAttemptAt: 'desc' },
      take: 50,
    });
  }

  @Roles('SUPER_ADMIN')
  @Get('platform-stats')
  async getPlatformStats() {
    const [smsCount, emailCount] = await Promise.all([
      this.prisma.notificationDelivery.count({ where: { channel: 'SMS', status: 'DELIVERED' } }),
      this.prisma.notificationDelivery.count({ where: { channel: 'EMAIL', status: 'DELIVERED' } }),
    ]);

    return {
      smsCount,
      emailCount,
    };
  }
}
