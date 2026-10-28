import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateRoomDto,
  CreateBellScheduleDto,
  CreateTimetableEntryDto,
  CreateTimetableVersionDto,
  CreateSubstitutionDto,
  CreateCalendarEventDto
} from './dto/timetable.dto';
import { EntryStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TIMETABLE_OFFICER')
  @Get('dashboard')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.timetableService.getDashboardMetrics(schoolId);
  }

  // Rooms
  @Get('rooms')
  getRooms(@ActiveSchool() schoolId: string) {
    return this.timetableService.findAllRooms(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'TIMETABLE_OFFICER')
  @Post('rooms')
  createRoom(@ActiveSchool() schoolId: string, @Body() dto: CreateRoomDto, @CurrentUser() user: any) {
    return this.timetableService.createRoom(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'TIMETABLE_OFFICER')
  @Patch('rooms/:id')
  updateRoom(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateRoomDto> & { status?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.timetableService.updateRoom(schoolId, id, dto, user.id);
  }

  // Bell Schedules
  @Get('bell-schedules')
  getBellSchedules(@ActiveSchool() schoolId: string) {
    return this.timetableService.findAllBellSchedules(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'TIMETABLE_OFFICER')
  @Post('bell-schedules')
  createBellSchedule(@ActiveSchool() schoolId: string, @Body() dto: CreateBellScheduleDto, @CurrentUser() user: any) {
    return this.timetableService.createBellSchedule(schoolId, dto, user.id);
  }

  // Entries
  @Get('entries')
  async getEntries(@ActiveSchool() schoolId: string, @Query() filters: any, @CurrentUser() user: any) {
    // If student, filter by their current class
    if (user.roles?.includes('STUDENT')) {
      const student = await this.timetableService.findStudentByUserId(schoolId, user.id);
      if (!student) return [];

      const enrollment = await this.timetableService.findCurrentEnrollment(student.id);
      if (!enrollment) return [];

      return this.timetableService.findAllEntries(schoolId, {
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
        status: EntryStatus.PUBLISHED
      });
    }

    return this.timetableService.findAllEntries(schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'TIMETABLE_OFFICER')
  @Post('entries')
  createEntry(@ActiveSchool() schoolId: string, @Body() dto: CreateTimetableEntryDto, @CurrentUser() user: any) {
    return this.timetableService.createTimetableEntry(schoolId, dto, user.id);
  }

  // Substitutions
  @Get('substitutions')
  getSubstitutions(@ActiveSchool() schoolId: string) {
    return this.timetableService.findAllSubstitutions(schoolId);
  }

  @Roles('SCHOOL_ADMIN', 'TIMETABLE_OFFICER', 'ACADEMIC_COORDINATOR')
  @Post('substitutions')
  createSubstitution(@ActiveSchool() schoolId: string, @Body() dto: CreateSubstitutionDto, @CurrentUser() user: any) {
    return this.timetableService.createSubstitution(schoolId, dto, user.id);
  }

  // Calendar
  @Get('calendar')
  getCalendar(@ActiveSchool() schoolId: string, @Query('academicYearId') academicYearId: string) {
    return this.timetableService.getCalendar(schoolId, academicYearId);
  }

  @Roles('SCHOOL_ADMIN', 'ACADEMIC_COORDINATOR')
  @Post('calendar')
  createCalendarEvent(@ActiveSchool() schoolId: string, @Body() dto: CreateCalendarEventDto, @CurrentUser() user: any) {
    return this.timetableService.createCalendarEvent(schoolId, dto, user.id);
  }
}
