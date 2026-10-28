import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  CreateDriverDto,
  UpdateDriverDto,
  CreateRouteDto,
  UpdateRouteDto,
  CreateStopDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  ScheduleTripDto,
  MarkAttendanceDto,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  CreateFuelRecordDto,
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

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Patch('vehicles/:id')
  updateVehicle(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.updateVehicle(schoolId, id, dto, user.id);
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

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Patch('drivers/:id')
  updateDriver(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.updateDriver(schoolId, id, dto, user.id);
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
  @Patch('routes/:id')
  updateRoute(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRouteDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.updateRoute(schoolId, id, dto, user.id);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('routes/:id/stops')
  addStop(
    @ActiveSchool() schoolId: string,
    @Param('id') routeId: string,
    @Body() dto: CreateStopDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.addStop(schoolId, routeId, dto, user.id);
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

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Patch('assignments/:id')
  updateAssignment(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.updateAssignment(schoolId, id, dto, user.id);
  }

  // Trips
  @Get('trips')
  getTrips(@ActiveSchool() schoolId: string) {
    return this.transportService.findAllTrips(schoolId);
  }

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
  markAttendance(
    @ActiveSchool() schoolId: string,
    @Param('id') tripId: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.markAttendance(schoolId, tripId, dto, user.id);
  }

  // Maintenance
  @Get('maintenance')
  getMaintenance(@ActiveSchool() schoolId: string) {
    return this.transportService.findAllMaintenance(schoolId);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('maintenance')
  createMaintenance(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateMaintenanceDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.createMaintenance(schoolId, dto, user.id);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Patch('maintenance/:id')
  updateMaintenance(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.updateMaintenance(schoolId, id, dto, user.id);
  }

  // Fuel
  @Get('fuel')
  getFuel(@ActiveSchool() schoolId: string) {
    return this.transportService.findAllFuel(schoolId);
  }

  @Roles('TRANSPORT_OFFICER', 'SCHOOL_ADMIN')
  @Post('fuel')
  createFuel(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateFuelRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.transportService.createFuelRecord(schoolId, dto, user.id);
  }
}
