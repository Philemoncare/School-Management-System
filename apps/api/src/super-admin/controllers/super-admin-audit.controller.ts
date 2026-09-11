import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin/audit')
export class SuperAdminAuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAuditLogs(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('action') action?: string,
    @Query('module') module?: string,
  ) {
    const where = {
      ...(action ? { action } : {}),
      ...(module ? { module } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: skip ? parseInt(skip) : 0,
        take: take ? parseInt(take) : 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { items, total };
  }
}
