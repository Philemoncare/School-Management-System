import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateVehicleDto,
  CreateDriverDto,
  CreateRouteDto,
  CreateStopDto,
  CreateAssignmentDto,
  ScheduleTripDto,
  MarkAttendanceDto
} from './dto/transport.dto';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get('dashboard')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.transportService.getDashboardMetrics(schoolId);
  }

  // Vehicles
  @Get('vehicles')
  getVehicles(@ActiveSchool() schoolId: string) {
    return this.transportService.findAllVehicles(schoolId);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('vehicles')
  createVehicle(@ActiveSchool() schoolId: string, @Body() dto: CreateVehicleDto, @CurrentUser() user: any) {
    return this.transportService.createVehicle(schoolId, dto, user.id);
  }

  // Drivers
  @Get('drivers')
  getDrivers(@ActiveSchool() schoolId: string) {
    return this.transportService.findAllDrivers(schoolId);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('drivers')
  createDriver(@ActiveSchool() schoolId: string, @Body() dto: CreateDriverDto, @CurrentUser() user: any) {
    return this.transportService.createDriver(schoolId, dto, user.id);
  }

  // Routes
  @Get('routes')
  getRoutes(@ActiveSchool() schoolId: string) {
    return this.transportService.findAllRoutes(schoolId);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('routes')
  createRoute(@ActiveSchool() schoolId: string, @Body() dto: CreateRouteDto, @CurrentUser() user: any) {
    return this.transportService.createRoute(schoolId, dto, user.id);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('routes/:id/stops')
  addStop(@Param('id') routeId: string, @Body() dto: CreateStopDto) {
    return this.transportService.addStop(routeId, dto);
  }

  // Assignments
  @Get('assignments')
  getAssignments(@ActiveSchool() schoolId: string) {
    return this.transportService.findAllAssignments(schoolId);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('assignments')
  createAssignment(@ActiveSchool() schoolId: string, @Body() dto: CreateAssignmentDto, @CurrentUser() user: any) {
    return this.transportService.createAssignment(schoolId, dto, user.id);
  }

  // Trips
  @Get('trips/:id')
  getTrip(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.transportService.getTripDetails(schoolId, id);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('trips')
  scheduleTrip(@ActiveSchool() schoolId: string, @Body() dto: ScheduleTripDto, @CurrentUser() user: any) {
    return this.transportService.scheduleTrip(schoolId, dto, user.id);
  }

  @Roles('DRIVER', 'TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('trips/:id/start')
  startTrip(@ActiveSchool() schoolId: string, @Param('id') id: string, @CurrentUser() user: any) {
    return this.transportService.startTrip(schoolId, id, user.id);
  }

  @Roles('DRIVER', 'TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('trips/:id/complete')
  completeTrip(@ActiveSchool() schoolId: string, @Param('id') id: string, @CurrentUser() user: any) {
    return this.transportService.completeTrip(schoolId, id, user.id);
  }

  @Roles('DRIVER', 'TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('trips/:id/attendance')
  markAttendance(@Param('id') tripId: string, @Body() dto: MarkAttendanceDto, @CurrentUser() user: any) {
    return this.transportService.markAttendance(tripId, dto, user.id);
  }
}
