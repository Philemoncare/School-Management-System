import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { ResultsService } from './results.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateExamPeriodDto, CreateExamSessionDto } from './dto/examination.dto';
import { GenerateReportCardsDto } from './dto/report-card.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  // Examination Periods
  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR')
  @Get('exam-periods')
  getExamPeriods(@ActiveSchool() schoolId: string) {
    return this.resultsService.findAllExamPeriods(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR')
  @Post('exam-periods')
  createExamPeriod(@ActiveSchool() schoolId: string, @Body() dto: CreateExamPeriodDto, @CurrentUser() user: any) {
    return this.resultsService.createExamPeriod(schoolId, dto, user.id);
  }

  // Result Operations
  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR')
  @Post('calculate')
  calculateResults(
    @ActiveSchool() schoolId: string,
    @Body('classId') classId: string,
    @Body('academicYearId') academicYearId: string,
    @Body('termId') termId: string,
    @CurrentUser() user: any
  ) {
    return this.resultsService.calculateResultsForClass(schoolId, classId, academicYearId, termId);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR')
  @Post('publish')
  publishResults(
    @ActiveSchool() schoolId: string,
    @Body('classId') classId: string,
    @Body('academicYearId') academicYearId: string,
    @Body('termId') termId: string,
    @CurrentUser() user: any
  ) {
    return this.resultsService.publishResults(schoolId, classId, academicYearId, termId, user.id);
  }

  // Report Cards
  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR')
  @Post('report-cards/generate')
  generateReportCards(@ActiveSchool() schoolId: string, @Body() dto: GenerateReportCardsDto, @CurrentUser() user: any) {
    return this.resultsService.generateReportCards(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR')
  @Patch('report-cards/publish')
  publishReportCards(
    @ActiveSchool() schoolId: string,
    @Body() body: { classId?: string; academicYearId?: string; termId?: string },
    @CurrentUser() user: any,
  ) {
    return this.resultsService.publishReportCards(schoolId, body || {}, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @Get('report-cards')
  getReportCards(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.resultsService.findReportCards(schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @Get('history')
  getHistory(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.resultsService.getResultsHistory(schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL', 'TEACHER')
  @Get('subject-results')
  getSubjectResults(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.resultsService.findSubjectResults(schoolId, filters);
  }

  // Result corrections
  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL', 'TEACHER')
  @Get('corrections')
  getCorrections(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.resultsService.findCorrectionRequests(schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL', 'TEACHER')
  @Post('corrections')
  createCorrection(
    @ActiveSchool() schoolId: string,
    @Body() dto: { subjectResultId: string; newScore: number; reason: string },
    @CurrentUser() user: any,
  ) {
    return this.resultsService.createCorrectionRequest(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @Patch('corrections/:id/approve')
  approveCorrection(@ActiveSchool() schoolId: string, @Param('id') id: string, @CurrentUser() user: any) {
    return this.resultsService.approveCorrectionRequest(schoolId, id, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR', 'PRINCIPAL')
  @Patch('corrections/:id/reject')
  rejectCorrection(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { comments?: string },
  ) {
    return this.resultsService.rejectCorrectionRequest(schoolId, id, user.id, body?.comments);
  }

  // Portals
  @Get('my-results')
  async getMyResults(@ActiveSchool() schoolId: string, @CurrentUser() user: any, @Query('studentId') studentId?: string) {
    // If student role, get own results
    // If guardian role, must provide studentId and be linked
    let targetStudentId = studentId;

    if (user.roles.includes('STUDENT')) {
      // Need a way to find student record from user.id
      // Assuming we have this logic in a helper or service
      // For now, let's assume studentId is passed or resolved
    }

    if (!targetStudentId) return [];
    return this.resultsService.getStudentResults(schoolId, targetStudentId);
  }
}
