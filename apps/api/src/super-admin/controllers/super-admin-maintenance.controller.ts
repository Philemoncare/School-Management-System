import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin/maintenance')
export class SuperAdminMaintenanceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  getMaintenanceWindows() {
    return this.prisma.maintenanceWindow.findMany({
      orderBy: { startAt: 'desc' }
    });
  }

  @Post()
  async scheduleMaintenance(@Body() dto: any, @CurrentUser() user: any) {
    const window = await this.prisma.maintenanceWindow.create({
      data: {
        ...dto,
        createdBy: user.id
      }
    });

    await this.audit.log({
      userId: user.id,
      action: 'MAINTENANCE_SCHEDULED',
      module: 'SYSTEM',
      resourceId: window.id,
      metadata: { title: window.title }
    });

    return window;
  }

  @Patch(':id')
  async updateStatus(@Param('id') id: string, @Body('status') status: any, @CurrentUser() user: any) {
    const window = await this.prisma.maintenanceWindow.update({
      where: { id },
      data: { status }
    });

    await this.audit.log({
      userId: user.id,
      action: 'MAINTENANCE_STATUS_UPDATED',
      module: 'SYSTEM',
      resourceId: window.id,
      metadata: { status }
    });

    return window;
  }
}
