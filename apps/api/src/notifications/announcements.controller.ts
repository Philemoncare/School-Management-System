import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AudienceType } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any
  ) {
    return this.announcementsService.create(schoolId, user.id, dto);
  }

  @Get()
  findAll(
    @ActiveSchool() schoolId: string,
    @Query('audienceType') audienceType?: AudienceType
  ) {
    return this.announcementsService.findAll(schoolId, audienceType);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id/publish')
  publish(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.announcementsService.publish(schoolId, id);
  }
}
