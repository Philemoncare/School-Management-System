import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateTeacherDto,
    @CurrentUser() user: any
  ) {
    return this.teachersService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST', 'TIMETABLE_OFFICER', 'ACADEMIC_COORDINATOR')
  @Get()
  findAll(
    @ActiveSchool() schoolId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.teachersService.findAll(schoolId, pagination);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get(':id')
  findOne(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.teachersService.findOne(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
    @CurrentUser() user: any,
  ) {
    return this.teachersService.update(schoolId, id, dto, user.id);
  }
}
