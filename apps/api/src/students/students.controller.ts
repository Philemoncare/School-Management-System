import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() createStudentDto: CreateStudentDto,
    @CurrentUser() user: any
  ) {
    return this.studentsService.create(schoolId, createStudentDto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'RECEPTIONIST', 'ACCOUNTANT')
  @Get()
  findAll(
    @ActiveSchool() schoolId: string,
    @Query() pagination: PaginationDto
  ) {
    return this.studentsService.findAll(schoolId, pagination);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT')
  @Get(':id/overview')
  getOverview(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.studentsService.getOverview(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'ACCOUNTANT')
  @Get(':id')
  findOne(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.studentsService.findOne(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() user: any
  ) {
    return this.studentsService.update(schoolId, id, updateStudentDto, user.id);
  }
}
