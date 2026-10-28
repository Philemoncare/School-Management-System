import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PLATFORM_READ_ROLES } from '../../auth/platform-roles';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/audit')
export class SuperAdminAuditController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getAuditLogs(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('schoolId') schoolId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.superAdminService.getAuditLogs({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      action,
      module,
      schoolId,
      from,
      to,
    });
  }

  @Get('filters')
  getFilters() {
    return this.superAdminService.getAuditFilters();
  }
}
