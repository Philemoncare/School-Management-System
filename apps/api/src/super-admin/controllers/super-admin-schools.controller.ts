import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  PLATFORM_OPERATOR_ROLES,
  PLATFORM_READ_ROLES,
} from '../../auth/platform-roles';
import { SchoolStatus } from '@prisma/client';
import {
  AssignSubscriptionDto,
  ProvisionSchoolDto,
  UpdateSchoolDto,
  UpdateSchoolStatusDto,
} from '../dto/super-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/schools')
export class SuperAdminSchoolsController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getSchools(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('region') region?: string,
    @Query('schoolType') schoolType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sort') sort?: string,
  ) {
    const statuses = status
      ? (status.split(',').filter(Boolean) as SchoolStatus[])
      : undefined;

    return this.superAdminService.getSchools({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      statuses,
      region,
      schoolType,
      from,
      to,
      sort: sort === 'name' ? 'name' : undefined,
    });
  }

  @Get('filters')
  getFilters() {
    return this.superAdminService.getSchoolFilters();
  }

  @Post()
  @Roles(...PLATFORM_OPERATOR_ROLES)
  provisionSchool(@Body() dto: ProvisionSchoolDto, @CurrentUser() user: any) {
    return this.superAdminService.provisionSchool(dto, user.id);
  }

  @Get(':id')
  getSchoolDetail(@Param('id') id: string) {
    return this.superAdminService.getSchoolDetail(id);
  }

  @Patch(':id')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  updateSchool(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolDto,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.updateSchool(id, dto, user.id);
  }

  @Patch(':id/status')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSchoolStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.updateSchoolStatus(id, dto.status, user.id, dto.reason);
  }

  @Post(':id/subscription')
  @Roles(...PLATFORM_OPERATOR_ROLES)
  assignSubscription(
    @Param('id') id: string,
    @Body() dto: AssignSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.assignSubscription(id, dto, user.id);
  }
}
