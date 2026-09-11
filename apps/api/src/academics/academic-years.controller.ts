import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AcademicYearStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateAcademicYearDto,
    @CurrentUser() user: any
  ) {
    return this.academicYearsService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'RECEPTIONIST')
  @Get()
  findAll(@ActiveSchool() schoolId: string) {
    return this.academicYearsService.findAll(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('current')
  getCurrent(@ActiveSchool() schoolId: string) {
    return this.academicYearsService.getCurrent(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get(':id')
  findOne(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.academicYearsService.findOne(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
    @CurrentUser() user: any
  ) {
    return this.academicYearsService.update(schoolId, id, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id/activate')
  activate(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.academicYearsService.setStatus(schoolId, id, AcademicYearStatus.ACTIVE, user.id);
  }
}
