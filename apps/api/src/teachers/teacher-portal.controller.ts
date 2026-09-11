import { Controller, Get, UseGuards } from '@nestjs/common';
import { TeacherPortalService } from './teacher-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles('TEACHER')
@Controller('teacher-portal')
export class TeacherPortalController {
  constructor(private readonly teacherPortalService: TeacherPortalService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.teacherPortalService.getDashboardMetrics(user.id, schoolId);
  }

  @Get('assignments')
  getAssignments(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.teacherPortalService.getMyAssignments(user.id, schoolId);
  }

  @Get('students')
  getStudents(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.teacherPortalService.getMyStudents(user.id, schoolId);
  }

  @Get('timetable')
  getTimetable(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.teacherPortalService.getMyTimetable(user.id, schoolId);
  }
}
