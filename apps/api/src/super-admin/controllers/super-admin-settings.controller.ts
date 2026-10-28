import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from '../../settings/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  PLATFORM_OPERATOR_ROLES,
  PLATFORM_SUPER_ROLES,
} from '../../auth/platform-roles';
import { CreateFeatureFlagDto, UpdateSettingDto } from '../../settings/dto/settings.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_OPERATOR_ROLES)
@Controller('super-admin/settings')
export class SuperAdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('platform')
  getPlatformSettings() {
    return this.settingsService.getPlatformSettings();
  }

  @Get('platform/:key')
  getPlatformSetting(@Param('key') key: string) {
    return this.settingsService.getPlatformSetting(key);
  }

  @Put('platform/:key')
  @Roles(...PLATFORM_SUPER_ROLES)
  updatePlatformSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updatePlatformSetting(key, dto, user.id);
  }

  @Get('features')
  getFeatureFlags() {
    return this.settingsService.getPlatformFeatureFlags();
  }

  @Post('features')
  @Roles(...PLATFORM_SUPER_ROLES)
  createFeatureFlag(@Body() dto: CreateFeatureFlagDto, @CurrentUser() user: any) {
    return this.settingsService.createFeatureFlag(dto, user.id);
  }

  @Put('features/:id')
  @Roles(...PLATFORM_SUPER_ROLES)
  updateFeatureFlag(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.settingsService.updateFeatureFlag(id, dto, user.id);
  }
}
