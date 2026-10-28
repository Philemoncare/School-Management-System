import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: any,
    @CurrentUser() user: any
  ) {
    return this.staffService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'RECEPTIONIST')
  @Get()
  findAll(
    @ActiveSchool() schoolId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.staffService.findAll(schoolId, pagination);
  }

  @Get('me')
  findMe(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any
  ) {
    return this.staffService.findMe(schoolId, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER')
  @Get(':id')
  findOne(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.staffService.findOne(schoolId, id);
  }
}
