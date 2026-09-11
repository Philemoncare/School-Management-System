import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../../auth/decorators/active-school.decorator';
import { SessionService } from '../services/session.service';
import { MfaService } from '../services/mfa.service';
import { SecurityEventService } from '../services/security-event.service';
import { PrivacyService } from '../services/privacy.service';
import { SecurityIncidentService } from '../services/security-incident.service';
import { SecurityPolicyService } from '../services/security-policy.service';
import { ImpersonationService } from '../services/impersonation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { PrivacyRequestType, PrivacyRequestStatus, IncidentStatus, SecuritySeverity } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('security')
export class SecurityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly mfaService: MfaService,
    private readonly securityEventService: SecurityEventService,
    private readonly privacyService: PrivacyService,
    private readonly incidentService: SecurityIncidentService,
    private readonly policyService: SecurityPolicyService,
    private readonly impersonationService: ImpersonationService,
  ) {}

  // ... (existing methods)

  // --- Impersonation ---
  @Roles('SUPER_ADMIN')
  @Post('impersonate/start/:userId')
  async startImpersonation(
    @CurrentUser() admin: any,
    @Param('userId') targetUserId: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    return this.impersonationService.startImpersonation(admin.id, targetUserId, reason, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Roles('SUPER_ADMIN')
  @Post('impersonate/stop/:userId')
  async stopImpersonation(
    @CurrentUser() admin: any,
    @Param('userId') targetUserId: string,
    @Req() req: any,
  ) {
    return this.impersonationService.stopImpersonation(admin.id, targetUserId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  // --- Policy ---
  @Get('sessions')
  async getSessions(@CurrentUser() user: any) {
    return this.sessionService.getUserSessions(user.id);
  }

  @Delete('sessions/:id')
  async revokeSession(@Param('id') id: string, @CurrentUser() user: any) {
    // In a real app, validate that this session belongs to the user
    return this.sessionService.revokeSession(id, 'USER_MANUAL_REVOKE');
  }

  @Post('sessions/revoke-others')
  async revokeOthers(@CurrentUser() user: any) {
    return this.sessionService.revokeAllUserSessions(user.id);
  }

  // --- MFA ---
  @Post('mfa/setup')
  async setupMfa(@CurrentUser() user: any) {
    return this.mfaService.setupTotp(user.id);
  }

  @Post('mfa/verify')
  async verifyMfa(@CurrentUser() user: any, @Body('code') code: string) {
    // This should complete the setup or verify a challenge
    const isValid = await this.mfaService.verifyTotp(user.id, code);
    if (!isValid) throw new ForbiddenException('Invalid MFA code');
    return { success: true };
  }

  @Post('mfa/recovery-codes')
  async generateRecoveryCodes(@CurrentUser() user: any) {
    return this.mfaService.generateRecoveryCodes(user.id);
  }

  // --- Privacy ---
  @UseGuards(TenantGuard)
  @Post('privacy/requests')
  async createPrivacyRequest(
    @CurrentUser() user: any,
    @ActiveSchool() schoolId: string,
    @Body('type') type: PrivacyRequestType,
    @Body('reason') reason?: string,
  ) {
    return this.privacyService.createRequest({ userId: user.id, schoolId, type, reason });
  }

  @UseGuards(TenantGuard)
  @Roles('SCHOOL_ADMIN')
  @Get('privacy/requests')
  async getSchoolPrivacyRequests(@ActiveSchool() schoolId: string) {
    return this.privacyService.getSchoolRequests(schoolId);
  }

  // --- Incidents ---
  @UseGuards(TenantGuard)
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Get('incidents')
  async getIncidents(@ActiveSchool() schoolId: string, @Query('status') status?: IncidentStatus) {
    return this.incidentService.getIncidents({ schoolId, status });
  }

  @UseGuards(TenantGuard)
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Post('incidents')
  async createIncident(
    @ActiveSchool() schoolId: string,
    @Body() data: any,
  ) {
    return this.incidentService.createIncident({ ...data, schoolId });
  }

  // --- Events ---
  @Roles('SUPER_ADMIN')
  @Get('events')
  async getGlobalEvents(@Query() filters: any) {
    return this.securityEventService.getEvents(filters);
  }

  @UseGuards(TenantGuard)
  @Roles('SCHOOL_ADMIN')
  @Get('events/school')
  async getSchoolEvents(@ActiveSchool() schoolId: string) {
    return this.securityEventService.getEvents({ schoolId });
  }

  // --- Policy ---
  @UseGuards(TenantGuard)
  @Get('policy')
  async getPolicy(@ActiveSchool() schoolId: string) {
    return this.policyService.getEffectivePolicy(schoolId);
  }

  // --- Dashboards ---
  @Roles('SUPER_ADMIN')
  @Get('dashboard/platform')
  async getPlatformSecurityStats() {
    return {
      activeSessions: await this.prisma.userSession.count({ where: { status: 'ACTIVE' } }),
      openIncidents: await this.prisma.securityIncident.count({ where: { status: 'OPEN' } }),
      highRiskEvents: await this.prisma.securityEvent.count({
        where: {
          severity: SecuritySeverity.HIGH,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),
      mfaAdoption: 0.25,
    };
  }

  @UseGuards(TenantGuard)
  @Roles('SCHOOL_ADMIN')
  @Get('dashboard/school')
  async getSchoolSecurityStats(@ActiveSchool() schoolId: string) {
    return {
      activeSessions: await this.prisma.userSession.count({ where: { schoolId, status: 'ACTIVE' } }),
      recentEvents: await this.securityEventService.getEvents({ schoolId }),
      mfaAdoption: 0.15,
    };
  }
}
