import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin/dashboard')
export class SuperAdminDashboardController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.superAdminService.getDashboardMetrics();
  }
}
