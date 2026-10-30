import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PLATFORM_READ_ROLES } from '../../auth/platform-roles';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/dashboard')
export class SuperAdminDashboardController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.superAdminService.getDashboardMetrics();
  }

  @Get('operations')
  getOperations() {
    return this.superAdminService.getOperationsData();
  }
}
