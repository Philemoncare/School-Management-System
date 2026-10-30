import { Controller, Get, Post, Put, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateSettingDto, SetNumberingRuleDto } from './dto/settings.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('effective')
  getEffective(@ActiveSchool() schoolId: string, @Query('keys') keys: string, @CurrentUser() user: any) {
    if (!keys) return {};
    const keyArray = keys.split(',');
    return this.settingsService.getManyEffectiveSettings(schoolId, keyArray, user.id);
  }

  @Get('features')
  getFeatures(@ActiveSchool() schoolId: string) {
    return this.settingsService.getFeatureFlags(schoolId);
  }

  @Get(':key')
  getSchoolSetting(@ActiveSchool() schoolId: string, @Param('key') key: string) {
    return this.settingsService.getSchoolSetting(schoolId, key);
  }

  @Roles('SCHOOL_ADMIN')
  @Put(':key')
  updateSchoolSetting(
    @ActiveSchool() schoolId: string,
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updateSchoolSetting(schoolId, key, dto, user.id);
  }

  @Roles('SUPER_ADMIN')
  @Put('platform/:key')
  updatePlatformSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updatePlatformSetting(key, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN')
  @Get('numbering/rules')
  getNumberingRules(@ActiveSchool() schoolId: string) {
    return this.settingsService.getNumberingRules(schoolId);
  }

  @Roles('SCHOOL_ADMIN')
  @Put('numbering/:type')
  setNumberingRule(
    @ActiveSchool() schoolId: string,
    @Param('type') type: string,
    @Body() dto: SetNumberingRuleDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.setNumberingRule(schoolId, type, dto, user.id);
  }

}
