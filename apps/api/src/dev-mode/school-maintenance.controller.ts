import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminService } from '../super-admin/super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('school/maintenance')
export class SchoolMaintenanceController {
  constructor(private readonly superAdmin: SuperAdminService) {}

  @Get('status')
  getMaintenanceStatus(@ActiveSchool() schoolId: string) {
    return this.superAdmin.getMaintenanceStatus(schoolId);
  }
}
