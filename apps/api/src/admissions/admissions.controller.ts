import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  CreateCampaignDto,
  SubmitApplicationDto,
  UpdateApplicationStatusDto,
  CreateDecisionDto,
  CreateOfferDto
} from './dto/admissions.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Get('dashboard')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.admissionsService.getDashboardMetrics(schoolId);
  }

  // Campaigns
  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Get('campaigns')
  getCampaigns(@ActiveSchool() schoolId: string) {
    return this.admissionsService.findAllCampaigns(schoolId);
  }

  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Post('campaigns')
  createCampaign(@ActiveSchool() schoolId: string, @Body() dto: CreateCampaignDto) {
    return this.admissionsService.createCampaign(schoolId, dto);
  }

  // Public application flow
  @Public()
  @Get('public/campaigns/:slug')
  getPublicCampaign(@Param('slug') slug: string) {
    return this.admissionsService.getPublicCampaign(slug);
  }

  @Public()
  @Post('public/campaigns/:slug/apply')
  submitPublicApplication(
    @Param('slug') slug: string,
    @Body() dto: SubmitApplicationDto,
  ) {
    return this.admissionsService.submitPublicApplication(slug, dto);
  }

  // Applications Management
  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Get('applications')
  getApplications(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.admissionsService.findAllApplications(schoolId, filters);
  }

  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Get('applications/:id')
  getApplication(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.admissionsService.findOneApplication(schoolId, id);
  }

  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Patch('applications/:id/status')
  updateStatus(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
    @CurrentUser() user: any
  ) {
    return this.admissionsService.updateApplicationStatus(schoolId, id, dto, user.id);
  }

  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Post('applications/:id/decision')
  makeDecision(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: CreateDecisionDto,
    @CurrentUser() user: any
  ) {
    return this.admissionsService.makeDecision(schoolId, id, dto, user.id);
  }

  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Post('applications/:id/offer')
  issueOffer(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: CreateOfferDto,
    @CurrentUser() user: any
  ) {
    return this.admissionsService.issueOffer(schoolId, id, dto, user.id);
  }

  @Public() // External link for accepting offers
  @Post('offers/:id/accept')
  acceptOffer(@Param('id') id: string) {
    return this.admissionsService.acceptOffer(id);
  }

  @Roles('ADMISSIONS_OFFICER', 'SCHOOL_ADMIN')
  @Post('applications/:id/confirm')
  confirmAdmission(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.admissionsService.confirmAdmission(schoolId, id, user.id);
  }
}
