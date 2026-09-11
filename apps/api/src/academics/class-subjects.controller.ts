import { Controller, Get, Post, Body, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ClassSubjectsService } from './class-subjects.service';
import { AssignSubjectDto } from './dto/class-subject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('class-subjects')
export class ClassSubjectsController {
  constructor(private readonly classSubjectsService: ClassSubjectsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  assign(
    @ActiveSchool() schoolId: string,
    @Body() dto: AssignSubjectDto,
    @CurrentUser() user: any
  ) {
    return this.classSubjectsService.assign(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('by-class/:classId')
  findByClass(
    @ActiveSchool() schoolId: string,
    @Param('classId') classId: string,
    @Query('sectionId') sectionId?: string
  ) {
    return this.classSubjectsService.findByClass(schoolId, classId, sectionId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Delete(':id')
  remove(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.classSubjectsService.remove(schoolId, id, user.id);
  }
}
