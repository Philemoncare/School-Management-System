import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  PLATFORM_OPERATOR_ROLES,
  PLATFORM_READ_ROLES,
} from '../../auth/platform-roles';
import { IncidentStatus, SecuritySeverity } from '@prisma/client';
import { UpdateSecurityIncidentDto, UpdateSecurityPolicyDto } from '../dto/super-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/security')
export class SuperAdminSecurityController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('overview')
  getOverview() {
    return this.superAdminService.getSecurityOverview();
  }

  @Get('incidents')
  getIncidents(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: IncidentStatus,
    @Query('severity') severity?: SecuritySeverity,
    @Query('search') search?: string,
  ) {
    return this.superAdminService.getSecurityIncidents({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      status,
      severity,
      search,
    });
  }

  @Patch('incidents/:id')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  updateIncident(
    @Param('id') id: string,
    @Body() dto: UpdateSecurityIncidentDto,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.updateSecurityIncident(id, dto, user.id);
  }

  @Get('events')
  getEvents(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('severity') severity?: SecuritySeverity,
    @Query('eventType') eventType?: string,
    @Query('search') search?: string,
  ) {
    return this.superAdminService.getSecurityEvents({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      severity,
      eventType,
      search,
    });
  }

  @Get('policy')
  getPolicy() {
    return this.superAdminService.getSecurityPolicy();
  }

  @Patch('policy')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  updatePolicy(@Body() dto: UpdateSecurityPolicyDto, @CurrentUser() user: any) {
    return this.superAdminService.updateSecurityPolicy(dto, user.id);
  }
}
