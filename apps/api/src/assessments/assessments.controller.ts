import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { ScoresService } from './scores.service';
import { CreateAssessmentDto, UpdateAssessmentDto } from './dto/assessment.dto';
import { CreateAssessmentTypeDto } from './dto/assessment-type.dto';
import { BulkEnterScoresDto } from './dto/score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly scoresService: ScoresService,
  ) {}

  // Types
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post('types')
  createType(@ActiveSchool() schoolId: string, @Body() dto: CreateAssessmentTypeDto, @CurrentUser() user: any) {
    return this.assessmentsService.createType(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('types')
  findAllTypes(@ActiveSchool() schoolId: string) {
    return this.assessmentsService.findAllTypes(schoolId);
  }

  // Assessments
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Post()
  create(@ActiveSchool() schoolId: string, @Body() dto: CreateAssessmentDto, @CurrentUser() user: any) {
    return this.assessmentsService.create(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get()
  findAll(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.assessmentsService.findAll(schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get(':id')
  findOne(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.assessmentsService.findOne(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Patch(':id/status')
  updateStatus(@ActiveSchool() schoolId: string, @Param('id') id: string, @Body('status') status: any, @CurrentUser() user: any) {
    return this.assessmentsService.updateStatus(schoolId, id, status, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Post(':id/submit')
  submit(@ActiveSchool() schoolId: string, @Param('id') id: string, @CurrentUser() user: any) {
    return this.assessmentsService.updateStatus(schoolId, id, 'SUBMITTED', user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Post(':id/publish')
  publish(@ActiveSchool() schoolId: string, @Param('id') id: string, @CurrentUser() user: any) {
    return this.assessmentsService.updateStatus(schoolId, id, 'PUBLISHED', user.id);
  }

  // Scores
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get(':id/eligible-students')
  getEligibleStudents(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.scoresService.getEligibleStudents(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Post(':id/bulk-mark')
  bulkMark(@ActiveSchool() schoolId: string, @Param('id') id: string, @Body() dto: BulkEnterScoresDto, @CurrentUser() user: any) {
    return this.scoresService.bulkEnterScores(schoolId, id, dto, user.id);
  }
}
