import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PLATFORM_OPERATOR_ROLES } from '../../auth/platform-roles';
import { CreateAnnouncementDto } from '../dto/super-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_OPERATOR_ROLES)
@Controller('super-admin/announcements')
export class SuperAdminAnnouncementsController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getAnnouncements() {
    return this.superAdminService.getPlatformAnnouncements();
  }

  @Post()
  createAnnouncement(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: any) {
    return this.superAdminService.createPlatformAnnouncement(dto, user.id);
  }

  @Post(':id/publish')
  publishAnnouncement(
    @Param('id') id: string,
    @Body() dto: Omit<CreateAnnouncementDto, 'title' | 'content'>,
    @CurrentUser() user: any,
  ) {
    return this.superAdminService.publishPlatformAnnouncement(id, dto, user.id);
  }
}
