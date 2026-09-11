import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SchoolStatus } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin/schools')
export class SuperAdminSchoolsController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getSchools(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: SchoolStatus,
  ) {
    return this.superAdminService.getSchools({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      search,
      status,
    });
  }

  @Get(':id')
  getSchoolDetail(@Param('id') id: string) {
    return this.superAdminService.getSchoolDetail(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: SchoolStatus,
    @CurrentUser() user: any
  ) {
    return this.superAdminService.updateSchoolStatus(id, status, user.id);
  }
}
