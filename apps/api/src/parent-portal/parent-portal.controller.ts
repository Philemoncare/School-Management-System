import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ParentPortalService } from './parent-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('parent')
@UseGuards(JwtAuthGuard, TenantGuard)
@Roles('PARENT', 'SCHOOL_ADMIN') // Allow parent or admin
export class ParentPortalController {
  constructor(private readonly parentService: ParentPortalService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    return this.parentService.getDashboard(user.id, schoolId);
  }

  @Get('children')
  getChildren(@CurrentUser() user: any, @ActiveSchool() schoolId: string) {
    // Already part of dashboard, but here for completeness
    return this.parentService.getDashboard(user.id, schoolId).then(d => d.students);
  }

  @Get('children/:studentId/profile')
  getChildProfile(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildProfile(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/academics')
  getChildAcademics(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildAcademics(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/timetable')
  getChildTimetable(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildTimetable(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/attendance')
  getChildAttendance(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildAttendance(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/results')
  getChildResults(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildResults(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/assessments')
  getChildAssessments(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildAssessments(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/assignments')
  getChildAssignments(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildAssignments(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/finance')
  getChildFinance(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildFinance(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/transport')
  getChildTransport(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildTransport(user.id, schoolId, studentId);
  }

  @Get('children/:studentId/library')
  getChildLibrary(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.parentService.getChildLibrary(user.id, schoolId, studentId);
  }
}
