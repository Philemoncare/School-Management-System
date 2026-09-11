import { Controller, Get, UseGuards } from '@nestjs/common';
import { SchoolDashboardService } from './school-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('schools/dashboard')
export class SchoolDashboardController {
  constructor(private readonly dashboardService: SchoolDashboardService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT')
  @Get('metrics')
  getMetrics(@ActiveSchool() schoolId: string) {
    return this.dashboardService.getDashboardMetrics(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('activity')
  getActivity(@ActiveSchool() schoolId: string) {
    return this.dashboardService.getFullActivityLog(schoolId);
  }
}
