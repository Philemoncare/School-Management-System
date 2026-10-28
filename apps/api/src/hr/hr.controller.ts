import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { HRService } from './hr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateDepartmentDto,
  CreatePositionDto,
  CreateLeaveTypeDto,
  CreateLeaveRequestDto,
  MarkStaffAttendanceDto,
  CreateStaffDocumentDto
} from './dto/hr.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('hr')
export class HRController {
  constructor(private readonly hrService: HRService) {}

  @Roles('HR_OFFICER', 'SCHOOL_ADMIN')
  @Get('dashboard')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.hrService.getDashboardMetrics(schoolId);
  }

  // Directory
  @Get('staff')
  getStaffDirectory(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.hrService.getStaffDirectory(schoolId, filters);
  }

  // Departments
  @Get('departments')
  getDepartments(@ActiveSchool() schoolId: string) {
    return this.hrService.findAllDepartments(schoolId);
  }

  @Roles('HR_OFFICER', 'SCHOOL_ADMIN')
  @Post('departments')
  createDepartment(@ActiveSchool() schoolId: string, @Body() dto: CreateDepartmentDto) {
    return this.hrService.createDepartment(schoolId, dto);
  }

  // Positions
  @Get('positions')
  getPositions(@ActiveSchool() schoolId: string) {
    return this.hrService.findAllPositions(schoolId);
  }

  @Roles('HR_OFFICER', 'SCHOOL_ADMIN')
  @Post('positions')
  createPosition(@ActiveSchool() schoolId: string, @Body() dto: CreatePositionDto) {
    return this.hrService.createPosition(schoolId, dto);
  }

  // Self-service
  @Get('me/leave')
  getMyLeaveRequests(@ActiveSchool() schoolId: string, @CurrentUser() user: any) {
    return this.hrService.getMyLeaveRequests(schoolId, user.id);
  }

  @Get('me/leave-balances')
  getMyLeaveBalances(@ActiveSchool() schoolId: string, @CurrentUser() user: any) {
    return this.hrService.getMyLeaveBalances(schoolId, user.id);
  }

  @Get('me/schedule')
  getMySchedule(@ActiveSchool() schoolId: string, @CurrentUser() user: any) {
    return this.hrService.getMySchedule(schoolId, user.id);
  }

  // Leave
  @Get('leave/types')
  getLeaveTypes(@ActiveSchool() schoolId: string) {
    return this.hrService.getLeaveTypes(schoolId);
  }

  @Roles('HR_OFFICER', 'SCHOOL_ADMIN')
  @Post('leave/types')
  createLeaveType(@ActiveSchool() schoolId: string, @Body() dto: CreateLeaveTypeDto) {
    return this.hrService.createLeaveType(schoolId, dto);
  }

  @Roles('HR_OFFICER', 'SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('leave/requests')
  getLeaveRequests(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.hrService.findAllLeaveRequests(schoolId, filters);
  }

  @Post('leave/requests')
  requestLeave(@ActiveSchool() schoolId: string, @Body() dto: CreateLeaveRequestDto, @CurrentUser() user: any) {
    return this.hrService.requestLeave(schoolId, dto, user.id);
  }

  @Roles('HR_OFFICER', 'SCHOOL_ADMIN')
  @Post('leave/requests/:id/approve')
  approveLeave(@ActiveSchool() schoolId: string, @Param('id') id: string, @CurrentUser() user: any) {
    return this.hrService.approveLeave(schoolId, id, user.id);
  }

  // Attendance
  @Roles('HR_OFFICER', 'SCHOOL_ADMIN')
  @Post('attendance')
  markAttendance(@ActiveSchool() schoolId: string, @Body() dto: MarkStaffAttendanceDto, @CurrentUser() user: any) {
    return this.hrService.markAttendance(schoolId, dto, user.id);
  }

  @Get('attendance')
  getAttendance(@ActiveSchool() schoolId: string, @Query('date') date: string) {
    return this.hrService.getAttendance(schoolId, new Date(date));
  }

  // Documents
  @Post('documents')
  uploadDocument(@ActiveSchool() schoolId: string, @Body() dto: CreateStaffDocumentDto, @CurrentUser() user: any) {
    return this.hrService.uploadDocument(schoolId, dto, user.id);
  }

  @Get('staff/:id/documents')
  getDocuments(@Param('id') id: string, @Query('type') type: 'STAFF' | 'TEACHER') {
    if (type === 'STAFF') return this.hrService.getStaffDocuments(id, undefined);
    return this.hrService.getStaffDocuments(undefined, id);
  }
}
