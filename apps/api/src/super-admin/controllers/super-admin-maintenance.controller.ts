import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  PLATFORM_OPERATOR_ROLES,
  PLATFORM_READ_ROLES,
} from '../../auth/platform-roles';
import {
  CreateMaintenanceWindowDto,
  UpdateMaintenanceWindowDto,
} from '../dto/super-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/maintenance')
export class SuperAdminMaintenanceController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getMaintenanceWindows() {
    return this.superAdminService.getMaintenanceWindows();
  }

  @Post()
  @Roles(...PLATFORM_OPERATOR_ROLES)
  scheduleMaintenance(@Body() dto: CreateMaintenanceWindowDto, @CurrentUser() user: any) {
    return this.superAdminService.createMaintenanceWindow(dto, user.id);
  }

  @Patch(':id')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  updateWindow(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceWindowDto,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.updateMaintenanceWindow(id, dto, user.id);
  }

  @Post(':id/start')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.superAdminService.startMaintenanceWindow(id, user.id);
  }

  @Post(':id/end')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  end(@Param('id') id: string, @CurrentUser() user: any) {
    return this.superAdminService.endMaintenanceWindow(id, user.id);
  }

  @Post(':id/cancel')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.cancelMaintenanceWindow(id, user.id, reason);
  }

  @Post(':id/broadcast')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  broadcast(@Param('id') id: string, @CurrentUser() user: any) {
    return this.superAdminService.broadcastMaintenance(id, user.id);
  }
}
