import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Query,
  Delete
} from '@nestjs/common';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import {
  UpdateHealthProfileDto,
  CreateClinicVisitDto,
  CreateHealthIncidentDto,
  AdministerMedicationDto,
  CreateFirstAidRecordDto,
  CreateClinicAppointmentDto,
  CreateHealthFollowUpDto,
  CreateHealthConsentDto,
  CreateHealthReferralDto,
  CreateCarePlanDto,
  UpdateCarePlanDto,
  CreateVitalSignDto,
  CreateHealthDocumentDto
} from './dto/health.dto';

@Controller('health')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard, PermissionsGuard)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('dashboard')
  @Roles('ADMIN', 'NURSE', 'MEDICAL_OFFICER')
  @Permissions('health.view')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.healthService.getDashboard(schoolId);
  }

  // --- QUEUE ---
  @Get('queue')
  @Roles('ADMIN', 'NURSE', 'MEDICAL_OFFICER')
  @Permissions('health.visit.view')
  getQueue(@ActiveSchool() schoolId: string) {
    return this.healthService.getQueue(schoolId);
  }

  // --- STUDENT PROFILES ---
  @Get('students/:studentId/profile')
  @Permissions('health.view')
  getStudentProfile(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: any
  ) {
    return this.healthService.getStudentProfile(schoolId, studentId, user.id);
  }

  @Patch('students/:studentId/profile')
  @Permissions('health.update')
  updateStudentProfile(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateHealthProfileDto,
    @CurrentUser() user: any
  ) {
    return this.healthService.updateStudentProfile(schoolId, studentId, dto, user.id);
  }

  // --- CLINIC VISITS ---
  @Post('visits')
  @Permissions('health.visit.create')
  createVisit(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateClinicVisitDto
  ) {
    return this.healthService.createVisit(schoolId, user.id, dto);
  }

  @Patch('visits/:id')
  @Permissions('health.visit.update')
  updateVisit(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any
  ) {
    return this.healthService.updateVisit(schoolId, id, dto, user.id);
  }

  // --- FIRST AID ---
  @Post('first-aid')
  @Permissions('health.create')
  createFirstAid(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateFirstAidRecordDto
  ) {
    return this.healthService.createFirstAidRecord(schoolId, user.id, dto);
  }

  // --- INCIDENTS ---
  @Get('incidents')
  @Permissions('health.view')
  findIncidents(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.healthService.findIncidents(schoolId, filters);
  }

  @Post('incidents')
  @Permissions('health.incident.create')
  createIncident(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateHealthIncidentDto
  ) {
    return this.healthService.createIncident(schoolId, user.id, dto);
  }

  // --- MEDICATIONS ---
  @Post('medications/:id/administer')
  @Permissions('health.medication.administer')
  administerMedication(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Param('id') medicationId: string,
    @Body() dto: AdministerMedicationDto
  ) {
    return this.healthService.administerMedication(schoolId, user.id, medicationId, dto);
  }

  // --- APPOINTMENTS ---
  @Post('appointments')
  @Permissions('health.create')
  createAppointment(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateClinicAppointmentDto
  ) {
    return this.healthService.createAppointment(schoolId, user.id, dto);
  }

  // --- CARE PLANS ---
  @Post('care-plans')
  @Permissions('health.care_plan.manage')
  createCarePlan(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateCarePlanDto
  ) {
    return this.healthService.createCarePlan(schoolId, user.id, dto);
  }

  @Patch('care-plans/:id')
  @Permissions('health.care_plan.manage')
  updateCarePlan(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCarePlanDto
  ) {
    return this.healthService.updateCarePlan(schoolId, id, user.id, dto);
  }

  // --- VITAL SIGNS ---
  @Post('vitals')
  @Permissions('health.update')
  recordVitalSign(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateVitalSignDto
  ) {
    return this.healthService.recordVitalSign(schoolId, user.id, dto);
  }

  // --- DOCUMENTS ---
  @Post('documents')
  @Permissions('health.document.upload')
  uploadDocument(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateHealthDocumentDto
  ) {
    return this.healthService.uploadDocument(schoolId, user.id, dto);
  }

  // --- SCREENINGS ---
  @Post('screenings')
  @Permissions('health.screening.manage')
  createScreening(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any
  ) {
    return this.healthService.createScreening(schoolId, user.id, dto);
  }

  @Post('screenings/results')
  @Permissions('health.screening.manage')
  recordScreeningResult(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any
  ) {
    return this.healthService.recordScreeningResult(schoolId, user.id, dto);
  }

  // --- IMMUNIZATIONS ---
  @Post('immunizations')
  @Permissions('health.immunization.manage')
  updateImmunization(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any
  ) {
    return this.healthService.updateImmunizationRecord(schoolId, user.id, dto);
  }

  // --- CONSENTS ---
  @Post('consents')
  @Permissions('health.consent.manage')
  recordConsent(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateHealthConsentDto
  ) {
    return this.healthService.recordConsent(schoolId, user.id, dto);
  }

  // --- REFERRALS ---
  @Post('referrals')
  @Permissions('health.referral.manage')
  createReferral(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateHealthReferralDto
  ) {
    return this.healthService.createReferral(schoolId, user.id, dto);
  }

  // --- BREAK GLASS ---
  @Post('break-glass')
  @Permissions('health.break_glass')
  logBreakGlass(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: { studentId: string; reason: string }
  ) {
    return this.healthService.logBreakGlass(schoolId, user.id, dto.studentId, dto.reason);
  }
}
