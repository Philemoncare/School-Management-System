import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceSessionDto, UpdateAttendanceSessionDto } from './dto/attendance-session.dto';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/student-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AttendanceSessionStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Post('sessions')
  createSession(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateAttendanceSessionDto,
    @CurrentUser() user: any
  ) {
    return this.attendanceService.createSession(schoolId, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('records')
  findRecords(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.attendanceService.findRecords(schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('sessions')
  findSessions(
    @ActiveSchool() schoolId: string,
    @Query() filters: any
  ) {
    return this.attendanceService.findSessions(schoolId, filters);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('sessions/:id')
  getSession(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.attendanceService.getSessionWithRecords(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('eligible-students')
  getEligibleStudentsForClass(
    @ActiveSchool() schoolId: string,
    @Query('classId') classId: string,
    @Query('sectionId') sectionId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.attendanceService.getEligibleStudentsForClass(
      schoolId,
      classId,
      sectionId || undefined,
      academicYearId || undefined,
    );
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Get('sessions/:id/eligible-students')
  getEligibleStudents(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.attendanceService.getEligibleStudents(schoolId, id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Post('sessions/:id/mark')
  markAttendance(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: any
  ) {
    return this.attendanceService.markAttendance(schoolId, id, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Post('sessions/:id/bulk-mark')
  bulkMarkAttendance(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: BulkMarkAttendanceDto,
    @CurrentUser() user: any
  ) {
    return this.attendanceService.bulkMarkAttendance(schoolId, id, dto, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  @Patch('sessions/:id/complete')
  completeSession(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.attendanceService.updateSessionStatus(schoolId, id, AttendanceSessionStatus.COMPLETED, user.id);
  }

  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @Patch('sessions/:id/lock')
  lockSession(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.attendanceService.updateSessionStatus(schoolId, id, AttendanceSessionStatus.LOCKED, user.id);
  }
}
