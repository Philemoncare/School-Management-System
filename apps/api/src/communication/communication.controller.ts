import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CommunicationStatus, NotificationPriority } from '@prisma/client';

@Controller('communications')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Get('dashboard')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.communicationService.getDashboardStats(schoolId);
  }

  @Post()
  @Roles('SCHOOL_ADMIN')
  createCommunication(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.communicationService.createCommunication(schoolId, user.id, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN')
  getCommunications(
    @ActiveSchool() schoolId: string,
    @Query('status') status?: CommunicationStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.communicationService.getCommunications(schoolId, { status, page, limit });
  }

  @Get('announcements')
  @Roles('SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  getAnnouncements(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('category') category?: string,
  ) {
    return this.communicationService.getAnnouncements(schoolId, user, category);
  }

  @Post('announcements')
  @Roles('SCHOOL_ADMIN')
  createAnnouncement(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.communicationService.createAnnouncement(schoolId, user.id, dto);
  }

  @Get('audience-preview')
  @Roles('SCHOOL_ADMIN')
  previewAudience(
    @ActiveSchool() schoolId: string,
    @Query('type') type: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.communicationService.previewAudience(schoolId, { type, classId, sectionId });
  }

  @Get('delivery-logs')
  @Roles('SCHOOL_ADMIN')
  getDeliveryLogs(
    @ActiveSchool() schoolId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.communicationService.getDeliveryLogs(schoolId, { page, limit, status, search });
  }

  @Post('delivery-logs/:id/retry')
  @Roles('SCHOOL_ADMIN')
  retryDelivery(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.communicationService.retryDelivery(schoolId, id);
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN')
  getCommunication(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.communicationService.getCommunication(schoolId, id);
  }

  @Post(':id/send')
  @Roles('SCHOOL_ADMIN')
  sendCommunication(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.communicationService.triggerSend(schoolId, id);
  }

  @Post('send-direct')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'RECEPTIONIST', 'ACCOUNTANT')
  sendDirectMessage(
    @ActiveSchool() schoolId: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    return this.communicationService.sendDirectMessage(schoolId, user.id, dto);
  }
}
