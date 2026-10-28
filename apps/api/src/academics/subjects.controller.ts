import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateSubjectDto,
    @CurrentUser() user: any
  ) {
    return this.subjectsService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'TIMETABLE_OFFICER', 'ACADEMIC_COORDINATOR')
  @Get()
  findAll(@ActiveSchool() schoolId: string) {
    return this.subjectsService.findAll(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get(':id')
  findOne(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.subjectsService.findOne(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() user: any
  ) {
    return this.subjectsService.update(schoolId, id, dto, user.id);
  }
}
