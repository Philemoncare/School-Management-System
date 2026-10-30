import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { DevModeService } from './dev-mode.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PLATFORM_SUPER_ROLES } from '../auth/platform-roles';

interface CurrentUserDto {
  id: string;
  email: string;
  roles: string[];
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_SUPER_ROLES)
@Controller('dev-mode')
export class DevModeController {
  constructor(private readonly devMode: DevModeService) {}

  private ctx(user: CurrentUserDto) {
    return {
      actorId: user.id,
      actorEmail: user.email,
      isProduction: process.env.NODE_ENV === 'production',
    };
  }

  @Get('status')
  getStatus(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.getDevModeStatus(this.ctx(user));
  }

  @Get('schools')
  listAllSchools(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.listAllSchoolsForDev(this.ctx(user));
  }

  @Get('schools/:id')
  inspectSchool(@Param('id') id: string, @CurrentUser() user: CurrentUserDto) {
    return this.devMode.inspectSchoolForDev(id, this.ctx(user));
  }

  @Get('schools/:id/workspace')
  enterWorkspace(@Param('id') id: string, @CurrentUser() user: CurrentUserDto) {
    return this.devMode.enterSchoolWorkspace(id, this.ctx(user));
  }

  @Get('features')
  getFeatureEntitlements(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.getFeatureEntitlementsForDev(this.ctx(user));
  }

  @Post('features/:id/toggle')
  toggleFeature(
    @Param('id') id: string,
    @Body('isEnabled') isEnabled: boolean,
    @CurrentUser() user: CurrentUserDto,
  ) {
    if (typeof isEnabled !== 'boolean') {
      throw new BadRequestException('isEnabled must be a boolean');
    }
    return this.devMode.toggleFeatureForDev(id, isEnabled, this.ctx(user));
  }

  @Post('features/:id/schools/:schoolId/toggle')
  toggleFeatureForSchool(
    @Param('id') id: string,
    @Param('schoolId') schoolId: string,
    @Body('isEnabled') isEnabled: boolean,
    @CurrentUser() user: CurrentUserDto,
  ) {
    if (typeof isEnabled !== 'boolean') {
      throw new BadRequestException('isEnabled must be a boolean');
    }
    return this.devMode.toggleFeatureForSchoolDev(id, schoolId, isEnabled, this.ctx(user));
  }

  @Post('test/sms')
  testSms(
    @Body() dto: { to: string; message: string },
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.devMode.testSmsIntegration(this.ctx(user), dto.to, dto.message);
  }

  @Post('test/email')
  testEmail(
    @Body() dto: { to: string; subject: string; body: string },
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.devMode.testEmailIntegration(this.ctx(user), dto.to, dto.subject, dto.body);
  }

  @Get('subscriptions')
  getAllSubscriptions(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.getAllSubscriptionsForDev(this.ctx(user));
  }

  @Post('subscriptions/assign')
  assignSubscriptionForDev(
    @Body() dto: { schoolId: string; planId: string; trialDays?: number; status?: string },
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.devMode.assignSubscriptionForDev(
      dto.schoolId,
      dto.planId,
      this.ctx(user),
      {
        trialDays: dto.trialDays,
        status: dto.status as any,
      },
    );
  }

  @Get('diagnostics')
  runDiagnostics(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.runDiagnostics(this.ctx(user));
  }

  @Get('jobs')
  getBackgroundJobs(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.getBackgroundJobs(this.ctx(user));
  }

  @Get('audit')
  getAuditEvents(@Query('schoolId') schoolId?: string, @CurrentUser() user?: CurrentUserDto) {
    return this.devMode.getAuditEventsForDev(this.ctx(user!), schoolId);
  }

  @Get('tenant-isolation')
  verifyTenantIsolation(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.verifyTenantIsolation(this.ctx(user));
  }

  @Get('settings')
  getPlatformSettings(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.getPlatformSettingsForDev(this.ctx(user));
  }

  @Get('safe-operations')
  getSafeOperations(@CurrentUser() user: CurrentUserDto) {
    return this.devMode.getSafeOperations(this.ctx(user));
  }
}
