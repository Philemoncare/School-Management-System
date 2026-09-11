import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Delete, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReportDefinitionDto, ExecuteReportDto, CreateReportScheduleDto, UpdateReportDefinitionDto, CreateReportDatasetDto, CreateReportFieldDto } from './dto/report.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('reporting')
export class ReportingController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly analyticsService: AnalyticsService
  ) {}

  @Get('definitions')
  getDefinitions(@ActiveSchool() schoolId: string) {
    return this.reportsService.findAllDefinitions(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Post('definitions')
  createDefinition(@ActiveSchool() schoolId: string, @Body() dto: CreateReportDefinitionDto, @CurrentUser() user: any) {
    return this.reportsService.createDefinition(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Patch('definitions/:id')
  updateDefinition(@ActiveSchool() schoolId: string, @Param('id') id: string, @Body() dto: UpdateReportDefinitionDto, @CurrentUser() user: any) {
    return this.reportsService.updateDefinition(schoolId, id, dto, user.id);
  }

  @Post('definitions/:id/execute')
  executeReport(@ActiveSchool() schoolId: string, @Param('id') id: string, @Body() dto: ExecuteReportDto, @CurrentUser() user: any) {
    return this.reportsService.executeReport(schoolId, id, dto, user.id);
  }

  // Dataset Endpoints (Platform level)
  @Roles('SUPER_ADMIN')
  @Get('datasets')
  getDatasets() {
    return this.reportsService.findAllDatasets();
  }

  @Roles('SUPER_ADMIN')
  @Post('datasets')
  createDataset(@Body() dto: CreateReportDatasetDto) {
    return this.reportsService.createDataset(dto);
  }

  @Roles('SUPER_ADMIN')
  @Post('datasets/:id/fields')
  addField(@Param('id') id: string, @Body() dto: CreateReportFieldDto) {
    return this.reportsService.addFieldToDataset(id, dto);
  }

  @Get('executions')
  getExecutions(@ActiveSchool() schoolId: string, @Query('definitionId') definitionId?: string) {
    return this.reportsService.getExecutions(schoolId, definitionId);
  }

  @Get('schedules')
  getSchedules(@ActiveSchool() schoolId: string) {
    return this.reportsService.getSchedules(schoolId);
  }

  @Roles('SCHOOL_ADMIN')
  @Post('schedules')
  createSchedule(@ActiveSchool() schoolId: string, @Body() dto: CreateReportScheduleDto, @CurrentUser() user: any) {
    return this.reportsService.createSchedule(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN')
  @Delete('schedules/:id')
  deleteSchedule(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.reportsService.deleteSchedule(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Delete('definitions/:id')
  deleteDefinition(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.reportsService.deleteDefinition(schoolId, id);
  }

  // Analytics Endpoints
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('analytics/overview')
  getOverview(@ActiveSchool() schoolId: string) {
    return this.analyticsService.getSchoolOverview(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'ACCOUNTANT', 'PRINCIPAL')
  @Get('analytics/finance')
  getFinance(@ActiveSchool() schoolId: string, @Query('academicYearId') academicYearId?: string) {
    return this.analyticsService.getFinanceAnalytics(schoolId, academicYearId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('analytics/academic')
  getAcademic(@ActiveSchool() schoolId: string, @Query('classId') classId?: string, @Query('academicYearId') academicYearId?: string) {
    return this.analyticsService.getAcademicAnalytics(schoolId, classId, academicYearId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('analytics/attendance')
  getAttendance(@ActiveSchool() schoolId: string, @Query('classId') classId?: string, @Query('academicYearId') academicYearId?: string) {
    return this.analyticsService.getAttendanceAnalytics(schoolId, classId, academicYearId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'ADMISSIONS_OFFICER')
  @Get('analytics/admissions')
  getAdmissions(@ActiveSchool() schoolId: string, @Query('campaignId') campaignId?: string) {
    return this.analyticsService.getAdmissionsAnalytics(schoolId, campaignId);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'HR_MANAGER')
  @Get('analytics/hr')
  getHR(@ActiveSchool() schoolId: string) {
    return this.analyticsService.getHRAnalytics(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'LIBRARIAN')
  @Get('analytics/library')
  getLibrary(@ActiveSchool() schoolId: string) {
    return this.analyticsService.getLibraryAnalytics(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'TRANSPORT_MANAGER')
  @Get('analytics/transport')
  getTransport(@ActiveSchool() schoolId: string) {
    return this.analyticsService.getTransportAnalytics(schoolId);
  }

  @Get('analytics/communication')
  getCommunication(@ActiveSchool() schoolId: string) {
    return this.analyticsService.getCommunicationAnalytics(schoolId);
  }

  @Get('analytics/documents')
  getDocuments(@ActiveSchool() schoolId: string) {
    return this.analyticsService.getDocumentAnalytics(schoolId);
  }

  @Get('analytics/examinations')
  getExaminations(@ActiveSchool() schoolId: string, @Query('examPeriodId') examPeriodId?: string) {
    return this.analyticsService.getExaminationAnalytics(schoolId, examPeriodId);
  }

  @Get('analytics/operations')
  getOperations(@ActiveSchool() schoolId: string) {
    return this.analyticsService.getOperationsAnalytics(schoolId);
  }

  @Roles('SUPER_ADMIN')
  @Get('analytics/platform')
  getPlatform() {
    return this.analyticsService.getPlatformAnalytics();
  }

  @Get('data-quality')
  getDataQuality(@ActiveSchool() schoolId: string) {
    return this.analyticsService.getDataQualityMetrics(schoolId);
  }
}
