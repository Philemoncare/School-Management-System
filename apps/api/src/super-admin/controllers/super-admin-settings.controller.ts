import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateSettingDto, CreateFeatureFlagDto } from '../settings/dto/settings.dto';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin/settings')
export class SuperAdminSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('platform/:key')
  getPlatformSetting(@Param('key') key: string) {
    return this.settingsService.getPlatformSetting(key);
  }

  @Put('platform/:key')
  updatePlatformSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: any,
  ) {
    return this.settingsService.updatePlatformSetting(key, dto, user.id);
  }

  @Get('features')
  getFeatureFlags() {
    return this.prisma.featureFlag.findMany();
  }

  @Put('features/:id')
  updateFeatureFlag(@Param('id') id: string, @Body() dto: any) {
    return this.prisma.featureFlag.update({
      where: { id },
      data: dto
    });
  }
}
