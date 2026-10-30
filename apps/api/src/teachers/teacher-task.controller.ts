import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeacherTaskService } from './teacher-task.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

export class CreateTeacherTaskDto {
  title: string;
  description?: string;
  category: string;
  priority?: string;
  instructions?: string;
  assignedToId: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  academicYearId?: string;
  termId?: string;
  startDate: string;
  dueDate: string;
}

export class UpdateTeacherTaskDto {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  instructions?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  academicYearId?: string;
  termId?: string;
  startDate?: string;
  dueDate?: string;
  completionNote?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('teacher-tasks')
export class TeacherTaskController {
  constructor(private readonly taskService: TeacherTaskService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateTeacherTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.taskService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'TEACHER')
  @Get()
  findAll(
    @ActiveSchool() schoolId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('overdue') overdue?: string,
    @CurrentUser() user?: any,
  ) {
    return this.taskService.findAll(schoolId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status: status as any,
      priority,
      category,
      assignedToId,
      classId,
      sectionId,
      subjectId,
      overdue: overdue === 'true',
    }, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'TEACHER')
  @Get('stats')
  getStats(@ActiveSchool() schoolId: string) {
    return this.taskService.getStats(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'TEACHER')
  @Get('teacher/:teacherId/summary')
  getTeacherSummary(
    @ActiveSchool() schoolId: string,
    @Param('teacherId') teacherId: string,
  ) {
    return this.taskService.getTeacherTaskSummary(schoolId, teacherId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'TEACHER')
  @Get(':id')
  findOne(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.taskService.findOne(schoolId, id, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'TEACHER')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.taskService.update(schoolId, id, dto as any, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER')
  @Delete(':id')
  remove(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.taskService.remove(schoolId, id, user.id);
  }
}
