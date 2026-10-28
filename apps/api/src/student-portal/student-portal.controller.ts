import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { StudentPortalService } from './student-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('student')
@UseGuards(JwtAuthGuard, TenantGuard)
@Roles('STUDENT')
export class StudentPortalController {
  constructor(private readonly studentPortalService: StudentPortalService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getDashboard(user.id, schoolId);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getProfile(user.id, schoolId);
  }

  @Get('subjects')
  getSubjects(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getClassesAndSubjects(user.id, schoolId);
  }

  @Get('timetable')
  getTimetable(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getTimetable(user.id, schoolId);
  }

  @Get('attendance')
  getAttendance(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getAttendance(user.id, schoolId);
  }

  @Get('assessments')
  getAssessments(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getAssessments(user.id, schoolId);
  }

  @Get('assignments')
  getAssignments(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getAssignments(user.id, schoolId);
  }

  @Post('assignments/:id/submit')
  submitAssignment(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('id') assignmentId: string,
    @Body() dto: { fileUrl: string, content: string },
  ) {
    return this.studentPortalService.submitAssignment(user.id, schoolId, assignmentId, dto.fileUrl, dto.content);
  }

  @Get('results')
  getResults(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getResults(user.id, schoolId);
  }

  @Get('finance')
  getFinance(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getFeesAndInvoices(user.id, schoolId);
  }

  @Get('library')
  getLibrary(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getLibraryLoans(user.id, schoolId);
  }

  @Get('transport')
  getTransport(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getTransportAssignment(user.id, schoolId);
  }

  @Get('announcements')
  getAnnouncements(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getAnnouncements(user.id, schoolId);
  }

  @Get('teachers')
  getTeachers(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getTeachers(user.id, schoolId);
  }

  @Get('examinations')
  getExaminations(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getExaminations(user.id, schoolId);
  }

  @Get('school')
  getSchool(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.studentPortalService.getSchoolInfo(user.id, schoolId);
  }
}
