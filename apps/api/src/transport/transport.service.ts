import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateVehicleDto,
  CreateDriverDto,
  CreateRouteDto,
  CreateStopDto,
  CreateAssignmentDto,
  ScheduleTripDto,
  MarkAttendanceDto
} from './dto/transport.dto';
import { TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';

@Injectable()
export class TransportService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getDashboardMetrics(schoolId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      activeDrivers,
      activeRoutes,
      studentsAssigned,
      tripsToday
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { schoolId, status: VehicleStatus.IN_SERVICE } }),
      this.prisma.vehicle.count({ where: { schoolId, status: VehicleStatus.AVAILABLE } }),
      this.prisma.vehicle.count({ where: { schoolId, status: VehicleStatus.MAINTENANCE } }),
      this.prisma.driver.count({ where: { schoolId, status: DriverStatus.ACTIVE } }),
      this.prisma.route.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.transportAssignment.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.transportTrip.findMany({
        where: { schoolId, date: { gte: today } },
        include: { vehicle: true, driver: true, route: true }
      }),
    ]);

    return {
      metrics: {
        activeVehicles,
        availableVehicles,
        maintenanceVehicles,
        activeDrivers,
        activeRoutes,
        studentsAssigned,
        totalTripsToday: tripsToday.length,
        tripsInProgress: tripsToday.filter(t => t.status === TripStatus.IN_PROGRESS).length,
        delayedTrips: tripsToday.filter(t => t.status === TripStatus.DELAYED).length,
      },
      recentTrips: tripsToday.slice(0, 10)
    };
  }

  // Vehicles
  async createVehicle(schoolId: string, dto: CreateVehicleDto, actorId: string) {
    const vehicle = await this.prisma.vehicle.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'VEHICLE_CREATED',
      module: 'TRANSPORT',
      resourceId: vehicle.id,
      metadata: { registrationNumber: dto.registrationNumber }
    });

    return vehicle;
  }

  async findAllVehicles(schoolId: string) {
    return this.prisma.vehicle.findMany({
      where: { schoolId },
      include: { driverAssignments: { include: { driver: { include: { staff: true } } } } },
      orderBy: { registrationNumber: 'asc' },
    });
  }

  // Drivers
  async createDriver(schoolId: string, dto: CreateDriverDto, actorId: string) {
    const driver = await this.prisma.driver.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'DRIVER_CREATED',
      module: 'TRANSPORT',
      resourceId: driver.id,
    });

    return driver;
  }

  async findAllDrivers(schoolId: string) {
    return this.prisma.driver.findMany({
      where: { schoolId },
      include: { staff: true, vehicleAssignments: { include: { vehicle: true } } },
    });
  }

  // Routes
  async createRoute(schoolId: string, dto: CreateRouteDto, actorId: string) {
    const route = await this.prisma.route.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ROUTE_CREATED',
      module: 'TRANSPORT',
      resourceId: route.id,
    });

    return route;
  }

  async addStop(routeId: string, dto: CreateStopDto) {
    return this.prisma.routeStop.create({
      data: { ...dto, routeId },
    });
  }

  async findAllRoutes(schoolId: string) {
    return this.prisma.route.findMany({
      where: { schoolId },
      include: { stops: { orderBy: { sequence: 'asc' } }, _count: { select: { assignments: true } } },
    });
  }

  // Assignments
  async createAssignment(schoolId: string, dto: CreateAssignmentDto, actorId: string) {
    // Check vehicle capacity on primary route vehicle if assigned
    const route = await this.prisma.route.findUnique({
      where: { id: dto.routeId },
      include: { assignments: { where: { status: 'ACTIVE' } } }
    });

    if (!route) throw new NotFoundException('Route not found');

    // Business Logic: Capacity Check could be more complex (per vehicle),
    // for now we validate against the route's current load if we want to enforce school-wide policies.

    const assignment = await this.prisma.transportAssignment.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TRANSPORT_ASSIGNMENT_CREATED',
      module: 'TRANSPORT',
      resourceId: assignment.id,
      metadata: { studentId: dto.studentId, routeId: dto.routeId }
    });

    return assignment;
  }

  async findAllAssignments(schoolId: string) {
    return this.prisma.transportAssignment.findMany({
      where: { schoolId },
      include: { student: true, route: true, pickupStop: true, dropoffStop: true },
    });
  }

  // Trips
  async scheduleTrip(schoolId: string, dto: ScheduleTripDto, actorId: string) {
    const trip = await this.prisma.transportTrip.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TRIP_SCHEDULED',
      module: 'TRANSPORT',
      resourceId: trip.id,
    });

    return trip;
  }

  async startTrip(schoolId: string, tripId: string, actorId: string) {
    return this.prisma.transportTrip.update({
      where: { id: tripId, schoolId },
      data: { status: TripStatus.IN_PROGRESS, actualStartTime: new Date() },
    });
  }

  async completeTrip(schoolId: string, tripId: string, actorId: string) {
    return this.prisma.transportTrip.update({
      where: { id: tripId, schoolId },
      data: { status: TripStatus.COMPLETED, actualEndTime: new Date() },
    });
  }

  async markAttendance(tripId: string, dto: MarkAttendanceDto, actorId: string) {
    return this.prisma.transportAttendance.create({
      data: { ...dto, tripId },
    });
  }

  async getTripDetails(schoolId: string, tripId: string) {
    const trip = await this.prisma.transportTrip.findFirst({
      where: { id: tripId, schoolId },
      include: {
        route: { include: { stops: { orderBy: { sequence: 'asc' } } } },
        vehicle: true,
        driver: { include: { staff: true } },
        attendances: { include: { student: true } },
      }
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }
}
