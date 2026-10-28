import { Controller, Get, Post, Body, Patch, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AudienceType, AnnouncementStatus } from '@prisma/client';

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
    @CurrentUser() user: any,
    @Query('audienceType') audienceType?: AudienceType
  ) {
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    const canManage = roles.includes('SCHOOL_ADMIN') || roles.includes('PRINCIPAL') || roles.includes('ADMIN');
    return this.announcementsService.findAll(
      schoolId,
      audienceType,
      canManage ? undefined : AnnouncementStatus.PUBLISHED,
    );
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id')
  update(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: any
  ) {
    return this.announcementsService.update(schoolId, id, dto);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id/publish')
  publish(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.announcementsService.publish(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch(':id/cancel')
  cancel(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.announcementsService.cancel(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Delete(':id')
  remove(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.announcementsService.remove(schoolId, id);
  }
}
