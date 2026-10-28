import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
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
import {
  TripStatus,
  VehicleStatus,
  DriverStatus,
  MaintenanceStatus,
  TransportAssignmentStatus,
} from '@prisma/client';

function requiredText(value: unknown, label: string) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    throw new BadRequestException(`${label} is required.`);
  }
  return text;
}

function optionalText(value: unknown) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

function parseDate(value: unknown, label: string) {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${label} is not a valid date.`);
  }
  return date;
}

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
      tripsToday,
      maintenanceDue,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: { schoolId, status: VehicleStatus.IN_SERVICE } }),
      this.prisma.vehicle.count({ where: { schoolId, status: VehicleStatus.AVAILABLE } }),
      this.prisma.vehicle.count({ where: { schoolId, status: VehicleStatus.MAINTENANCE } }),
      this.prisma.driver.count({ where: { schoolId, status: DriverStatus.ACTIVE } }),
      this.prisma.route.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.transportAssignment.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.transportTrip.findMany({
        where: { schoolId, date: { gte: today } },
        include: { vehicle: true, driver: true, route: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.vehicleMaintenance.count({
        where: {
          vehicle: { schoolId },
          status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.REPORTED, MaintenanceStatus.ACTIVE] },
        },
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
        maintenanceDue,
      },
      recentTrips: tripsToday.slice(0, 10)
    };
  }

  // Vehicles
  async createVehicle(schoolId: string, dto: CreateVehicleDto, actorId: string) {
    const registrationNumber = requiredText(dto.registrationNumber, 'Registration number');
    if (!Number.isInteger(dto.seatingCapacity) || dto.seatingCapacity < 1) {
      throw new BadRequestException('Seating capacity must be at least 1.');
    }
    const currentYear = new Date().getFullYear() + 1;
    if (dto.year !== undefined && dto.year !== null && (dto.year < 1950 || dto.year > currentYear)) {
      throw new BadRequestException(`Vehicle year must be between 1950 and ${currentYear}.`);
    }
    const duplicate = await this.prisma.vehicle.findFirst({
      where: { schoolId, registrationNumber: { equals: registrationNumber, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('A vehicle with this registration number already exists.');
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        schoolId,
        registrationNumber,
        make: optionalText(dto.make),
        model: optionalText(dto.model),
        year: dto.year ?? null,
        type: optionalText(dto.type),
        seatingCapacity: dto.seatingCapacity,
        status: dto.status ?? VehicleStatus.AVAILABLE,
        currentMileage: dto.currentMileage ?? null,
        acquisitionDate: dto.acquisitionDate ? parseDate(dto.acquisitionDate, 'Acquisition date') : null,
        acquisitionCost: dto.acquisitionCost ?? null,
        insuranceNumber: optionalText(dto.insuranceNumber),
        insuranceExpiry: dto.insuranceExpiry ? parseDate(dto.insuranceExpiry, 'Insurance expiry') : null,
        notes: optionalText(dto.notes),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'VEHICLE_CREATED',
      module: 'TRANSPORT',
      resourceId: vehicle.id,
      metadata: { registrationNumber: vehicle.registrationNumber }
    });

    return vehicle;
  }

  async updateVehicle(schoolId: string, id: string, dto: UpdateVehicleDto, actorId: string) {
    const existing = await this.prisma.vehicle.findFirst({ where: { id, schoolId } });
    if (!existing) {
      throw new NotFoundException('Vehicle not found.');
    }
    const registrationNumber = dto.registrationNumber !== undefined
      ? requiredText(dto.registrationNumber, 'Registration number')
      : existing.registrationNumber;

    if (dto.seatingCapacity !== undefined && (!Number.isInteger(dto.seatingCapacity) || dto.seatingCapacity < 1)) {
      throw new BadRequestException('Seating capacity must be at least 1.');
    }
    const currentYear = new Date().getFullYear() + 1;
    if (dto.year !== undefined && dto.year !== null && (dto.year < 1950 || dto.year > currentYear)) {
      throw new BadRequestException(`Vehicle year must be between 1950 and ${currentYear}.`);
    }
    if (registrationNumber.toLowerCase() !== existing.registrationNumber.toLowerCase()) {
      const duplicate = await this.prisma.vehicle.findFirst({
        where: {
          schoolId,
          registrationNumber: { equals: registrationNumber, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('A vehicle with this registration number already exists.');
      }
    }

    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        registrationNumber,
        ...(dto.make !== undefined ? { make: optionalText(dto.make) } : {}),
        ...(dto.model !== undefined ? { model: optionalText(dto.model) } : {}),
        ...(dto.year !== undefined ? { year: dto.year } : {}),
        ...(dto.type !== undefined ? { type: optionalText(dto.type) } : {}),
        ...(dto.seatingCapacity !== undefined ? { seatingCapacity: dto.seatingCapacity } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.currentMileage !== undefined ? { currentMileage: dto.currentMileage } : {}),
        ...(dto.insuranceNumber !== undefined ? { insuranceNumber: optionalText(dto.insuranceNumber) } : {}),
        ...(dto.insuranceExpiry !== undefined ? { insuranceExpiry: dto.insuranceExpiry } : {}),
        ...(dto.notes !== undefined ? { notes: optionalText(dto.notes) } : {}),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'VEHICLE_UPDATED',
      module: 'TRANSPORT',
      resourceId: vehicle.id,
      metadata: { registrationNumber: vehicle.registrationNumber, status: vehicle.status },
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
    const staff = await this.prisma.staff.findFirst({
      where: { id: dto.staffId, schoolId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!staff) {
      throw new BadRequestException('Select a staff member from this school.');
    }
    const licenseNumber = requiredText(dto.licenseNumber, 'License number');
    const licenseClass = requiredText(dto.licenseClass, 'License class');
    const licenseExpiry = parseDate(dto.licenseExpiry, 'License expiry');
    if (licenseExpiry.getTime() < Date.now()) {
      throw new BadRequestException('Licence expiry must be in the future.');
    }
    const existingDriver = await this.prisma.driver.findFirst({
      where: { staffId: dto.staffId },
      select: { id: true },
    });
    if (existingDriver) {
      throw new ConflictException('This staff member is already registered as a driver.');
    }
    const duplicateLicense = await this.prisma.driver.findFirst({
      where: { schoolId, licenseNumber: { equals: licenseNumber, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicateLicense) {
      throw new ConflictException('A driver with this licence number already exists.');
    }

    const driver = await this.prisma.driver.create({
      data: {
        schoolId,
        staffId: dto.staffId,
        licenseNumber,
        licenseClass,
        licenseExpiry,
        status: dto.status ?? DriverStatus.ACTIVE,
        notes: optionalText(dto.notes),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'DRIVER_CREATED',
      module: 'TRANSPORT',
      resourceId: driver.id,
      metadata: { staffId: staff.id },
    });

    return driver;
  }

  async updateDriver(schoolId: string, id: string, dto: UpdateDriverDto, actorId: string) {
    const existing = await this.prisma.driver.findFirst({ where: { id, schoolId } });
    if (!existing) {
      throw new NotFoundException('Driver not found.');
    }
    const licenseNumber = dto.licenseNumber !== undefined
      ? requiredText(dto.licenseNumber, 'License number')
      : existing.licenseNumber;
    const licenseExpiry = dto.licenseExpiry !== undefined
      ? parseDate(dto.licenseExpiry, 'License expiry')
      : existing.licenseExpiry;
    if (licenseExpiry.getTime() < Date.now()) {
      throw new BadRequestException('Licence expiry must be in the future.');
    }
    if (licenseNumber.toLowerCase() !== existing.licenseNumber.toLowerCase()) {
      const duplicate = await this.prisma.driver.findFirst({
        where: {
          schoolId,
          licenseNumber: { equals: licenseNumber, mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('A driver with this licence number already exists.');
      }
    }

    const driver = await this.prisma.driver.update({
      where: { id },
      data: {
        licenseNumber,
        licenseExpiry,
        ...(dto.licenseClass !== undefined ? { licenseClass: requiredText(dto.licenseClass, 'License class') } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: optionalText(dto.notes) } : {}),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'DRIVER_UPDATED',
      module: 'TRANSPORT',
      resourceId: driver.id,
      metadata: { status: driver.status },
    });

    return driver;
  }

  async findAllDrivers(schoolId: string) {
    return this.prisma.driver.findMany({
      where: { schoolId },
      include: { staff: true, vehicleAssignments: { include: { vehicle: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Routes
  async createRoute(schoolId: string, dto: CreateRouteDto, actorId: string) {
    const name = requiredText(dto.name, 'Route name');
    const duplicate = await this.prisma.route.findFirst({
      where: { schoolId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('A route with this name already exists.');
    }

    const route = await this.prisma.route.create({
      data: {
        schoolId,
        name,
        code: optionalText(dto.code),
        description: optionalText(dto.description),
        ...(dto.direction ? { direction: dto.direction } : {}),
        estimatedDuration: dto.estimatedDuration ?? null,
        estimatedDistance: dto.estimatedDistance ?? null,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ROUTE_CREATED',
      module: 'TRANSPORT',
      resourceId: route.id,
      metadata: { name: route.name },
    });

    return route;
  }

  async updateRoute(schoolId: string, id: string, dto: UpdateRouteDto, actorId: string) {
    const existing = await this.prisma.route.findFirst({ where: { id, schoolId } });
    if (!existing) {
      throw new NotFoundException('Route not found.');
    }
    const name = dto.name !== undefined ? requiredText(dto.name, 'Route name') : existing.name;
    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await this.prisma.route.findFirst({
        where: { schoolId, name: { equals: name, mode: 'insensitive' }, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('A route with this name already exists.');
      }
    }

    const route = await this.prisma.route.update({
      where: { id },
      data: {
        name,
        ...(dto.code !== undefined ? { code: optionalText(dto.code) } : {}),
        ...(dto.description !== undefined ? { description: optionalText(dto.description) } : {}),
        ...(dto.direction !== undefined ? { direction: dto.direction } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.estimatedDuration !== undefined ? { estimatedDuration: dto.estimatedDuration } : {}),
        ...(dto.estimatedDistance !== undefined ? { estimatedDistance: dto.estimatedDistance } : {}),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ROUTE_UPDATED',
      module: 'TRANSPORT',
      resourceId: route.id,
      metadata: { name: route.name, status: route.status },
    });

    return route;
  }

  async addStop(schoolId: string, routeId: string, dto: CreateStopDto, actorId: string) {
    const route = await this.prisma.route.findFirst({ where: { id: routeId, schoolId } });
    if (!route) {
      throw new NotFoundException('Route not found.');
    }
    const name = requiredText(dto.name, 'Stop name');
    if (!Number.isInteger(dto.sequence) || dto.sequence < 1) {
      throw new BadRequestException('Stop sequence must be a positive whole number.');
    }
    const duplicateSequence = await this.prisma.routeStop.findFirst({
      where: { routeId, sequence: dto.sequence },
      select: { id: true },
    });
    if (duplicateSequence) {
      throw new ConflictException('Another stop already uses this sequence number.');
    }

    const stop = await this.prisma.routeStop.create({
      data: {
        routeId,
        name,
        address: optionalText(dto.address),
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        sequence: dto.sequence,
        estimatedArrivalTime: optionalText(dto.estimatedArrivalTime),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ROUTE_STOP_CREATED',
      module: 'TRANSPORT',
      resourceId: stop.id,
      metadata: { routeId, name: stop.name, sequence: stop.sequence },
    });

    return stop;
  }

  async findAllRoutes(schoolId: string) {
    return this.prisma.route.findMany({
      where: { schoolId },
      include: {
        stops: { orderBy: { sequence: 'asc' } },
        _count: { select: { assignments: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Assignments
  async createAssignment(schoolId: string, dto: CreateAssignmentDto, actorId: string) {
    const [student, route] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId }, select: { id: true } }),
      this.prisma.route.findFirst({
        where: { id: dto.routeId, schoolId },
        include: { stops: true },
      }),
    ]);
    if (!student) {
      throw new BadRequestException('Select a student from this school.');
    }
    if (!route) {
      throw new BadRequestException('Select a route from this school.');
    }
    for (const [stopId, label] of [
      [dto.pickupStopId, 'Pickup stop'],
      [dto.dropoffStopId, 'Drop-off stop'],
    ] as const) {
      if (stopId && !route.stops.some((stop) => stop.id === stopId)) {
        throw new BadRequestException(`${label} does not belong to the selected route.`);
      }
    }
    const existing = await this.prisma.transportAssignment.findFirst({
      where: {
        schoolId,
        studentId: dto.studentId,
        routeId: dto.routeId,
        status: TransportAssignmentStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('This student already has an active assignment on this route.');
    }

    const assignment = await this.prisma.transportAssignment.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        routeId: dto.routeId,
        pickupStopId: dto.pickupStopId ?? null,
        dropoffStopId: dto.dropoffStopId ?? null,
        effectiveDate: dto.effectiveDate ? parseDate(dto.effectiveDate, 'Effective date') : new Date(),
        endDate: dto.endDate ? parseDate(dto.endDate, 'End date') : null,
        feeAmount: dto.feeAmount ?? null,
      },
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

  async updateAssignment(schoolId: string, id: string, dto: UpdateAssignmentDto, actorId: string) {
    const existing = await this.prisma.transportAssignment.findFirst({ where: { id, schoolId } });
    if (!existing) {
      throw new NotFoundException('Transport assignment not found.');
    }
    const assignment = await this.prisma.transportAssignment.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate } : {}),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TRANSPORT_ASSIGNMENT_UPDATED',
      module: 'TRANSPORT',
      resourceId: assignment.id,
      metadata: { status: assignment.status },
    });

    return assignment;
  }

  async findAllAssignments(schoolId: string) {
    return this.prisma.transportAssignment.findMany({
      where: { schoolId },
      include: { student: true, route: true, pickupStop: true, dropoffStop: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Trips
  async findAllTrips(schoolId: string) {
    return this.prisma.transportTrip.findMany({
      where: { schoolId },
      include: {
        route: true,
        vehicle: true,
        driver: { include: { staff: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async scheduleTrip(schoolId: string, dto: ScheduleTripDto, actorId: string) {
    const [route, vehicle, driver] = await Promise.all([
      this.prisma.route.findFirst({ where: { id: dto.routeId, schoolId }, select: { id: true } }),
      this.prisma.vehicle.findFirst({ where: { id: dto.vehicleId, schoolId }, select: { id: true, status: true } }),
      this.prisma.driver.findFirst({ where: { id: dto.driverId, schoolId }, select: { id: true, status: true } }),
    ]);
    if (!route) throw new BadRequestException('Select a route from this school.');
    if (!vehicle) throw new BadRequestException('Select a vehicle from this school.');
    if (!driver) throw new BadRequestException('Select a driver from this school.');
    if (vehicle.status === VehicleStatus.RETIRED || vehicle.status === VehicleStatus.OUT_OF_SERVICE) {
      throw new BadRequestException('This vehicle is not available for trips.');
    }
    if (driver.status !== DriverStatus.ACTIVE) {
      throw new BadRequestException('This driver is not active.');
    }
    const date = parseDate(dto.date, 'Trip date');

    const trip = await this.prisma.transportTrip.create({
      data: {
        schoolId,
        routeId: dto.routeId,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        scheduleId: dto.scheduleId ?? null,
        date,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TRIP_SCHEDULED',
      module: 'TRANSPORT',
      resourceId: trip.id,
      metadata: { routeId: dto.routeId, vehicleId: dto.vehicleId, driverId: dto.driverId },
    });

    return trip;
  }

  async startTrip(schoolId: string, tripId: string, actorId: string) {
    const trip = await this.prisma.transportTrip.findFirst({ where: { id: tripId, schoolId } });
    if (!trip) {
      throw new NotFoundException('Trip not found.');
    }
    if (trip.status === TripStatus.IN_PROGRESS) {
      throw new BadRequestException('This trip has already started.');
    }
    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      throw new BadRequestException('This trip can no longer be started.');
    }

    const updated = await this.prisma.transportTrip.update({
      where: { id: tripId },
      data: { status: TripStatus.IN_PROGRESS, actualStartTime: new Date() },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TRIP_STARTED',
      module: 'TRANSPORT',
      resourceId: tripId,
    });

    return updated;
  }

  async completeTrip(schoolId: string, tripId: string, actorId: string) {
    const trip = await this.prisma.transportTrip.findFirst({ where: { id: tripId, schoolId } });
    if (!trip) {
      throw new NotFoundException('Trip not found.');
    }
    if (trip.status === TripStatus.COMPLETED) {
      throw new BadRequestException('This trip is already completed.');
    }
    if (trip.status === TripStatus.CANCELLED) {
      throw new BadRequestException('This trip was cancelled.');
    }

    const updated = await this.prisma.transportTrip.update({
      where: { id: tripId },
      data: { status: TripStatus.COMPLETED, actualEndTime: new Date() },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TRIP_COMPLETED',
      module: 'TRANSPORT',
      resourceId: tripId,
    });

    return updated;
  }

  async markAttendance(schoolId: string, tripId: string, dto: MarkAttendanceDto, actorId: string) {
    const trip = await this.prisma.transportTrip.findFirst({ where: { id: tripId, schoolId } });
    if (!trip) {
      throw new NotFoundException('Trip not found.');
    }
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
      select: { id: true },
    });
    if (!student) {
      throw new BadRequestException('Select a student from this school.');
    }
    if (dto.stopId) {
      const stop = await this.prisma.routeStop.findFirst({
        where: { id: dto.stopId, routeId: trip.routeId },
        select: { id: true },
      });
      if (!stop) {
        throw new BadRequestException('The selected stop does not belong to this trip route.');
      }
    }

    return this.prisma.transportAttendance.create({
      data: {
        tripId,
        studentId: dto.studentId,
        stopId: dto.stopId ?? null,
        type: dto.type,
        status: dto.status,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      },
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

  // Maintenance
  async findAllMaintenance(schoolId: string) {
    return this.prisma.vehicleMaintenance.findMany({
      where: { vehicle: { schoolId } },
      include: { vehicle: true },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  async createMaintenance(schoolId: string, dto: CreateMaintenanceDto, actorId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, schoolId },
      select: { id: true, registrationNumber: true },
    });
    if (!vehicle) {
      throw new BadRequestException('Select a vehicle from this school.');
    }
    const type = requiredText(dto.type, 'Maintenance type');
    const scheduledDate = parseDate(dto.scheduledDate, 'Scheduled date');
    if (dto.cost !== undefined && dto.cost < 0) {
      throw new BadRequestException('Maintenance cost cannot be negative.');
    }

    const record = await this.prisma.vehicleMaintenance.create({
      data: {
        vehicleId: vehicle.id,
        type,
        description: optionalText(dto.description),
        scheduledDate,
        cost: dto.cost ?? null,
        provider: optionalText(dto.provider),
        mileage: dto.mileage ?? null,
        notes: optionalText(dto.notes),
        status: MaintenanceStatus.SCHEDULED,
      },
    });

    await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: VehicleStatus.MAINTENANCE },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'MAINTENANCE_SCHEDULED',
      module: 'TRANSPORT',
      resourceId: record.id,
      metadata: { vehicle: vehicle.registrationNumber, type },
    });

    return record;
  }

  async updateMaintenance(schoolId: string, id: string, dto: UpdateMaintenanceDto, actorId: string) {
    const existing = await this.prisma.vehicleMaintenance.findFirst({
      where: { id, vehicle: { schoolId } },
      include: { vehicle: true },
    });
    if (!existing) {
      throw new NotFoundException('Maintenance record not found.');
    }
    const status = dto.status
      ? (dto.status.toUpperCase() as MaintenanceStatus)
      : existing.status;
    if (!Object.values(MaintenanceStatus).includes(status)) {
      throw new BadRequestException('Unknown maintenance status.');
    }
    if (dto.cost !== undefined && dto.cost < 0) {
      throw new BadRequestException('Maintenance cost cannot be negative.');
    }

    const record = await this.prisma.vehicleMaintenance.update({
      where: { id },
      data: {
        status,
        ...(dto.completedDate !== undefined ? { completedDate: dto.completedDate } : {}),
        ...(dto.cost !== undefined ? { cost: dto.cost } : {}),
        ...(dto.notes !== undefined ? { notes: optionalText(dto.notes) } : {}),
      },
    });

    if (status === MaintenanceStatus.COMPLETED) {
      await this.prisma.vehicleMaintenance.update({
        where: { id },
        data: { completedDate: record.completedDate ?? new Date() },
      });
      if (existing.vehicle.status === VehicleStatus.MAINTENANCE) {
        await this.prisma.vehicle.update({
          where: { id: existing.vehicleId },
          data: { status: VehicleStatus.AVAILABLE },
        });
      }
    }

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'MAINTENANCE_UPDATED',
      module: 'TRANSPORT',
      resourceId: record.id,
      metadata: { status },
    });

    return record;
  }

  // Fuel
  async findAllFuel(schoolId: string) {
    return this.prisma.fuelRecord.findMany({
      where: { schoolId },
      include: { vehicle: true },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async createFuelRecord(schoolId: string, dto: CreateFuelRecordDto, actorId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, schoolId },
      select: { id: true, registrationNumber: true },
    });
    if (!vehicle) {
      throw new BadRequestException('Select a vehicle from this school.');
    }
    if (!Number.isFinite(dto.quantity) || dto.quantity <= 0) {
      throw new BadRequestException('Fuel quantity must be greater than zero.');
    }
    if (!Number.isFinite(dto.unitPrice) || dto.unitPrice < 0) {
      throw new BadRequestException('Unit price cannot be negative.');
    }
    const date = parseDate(dto.date, 'Fuel date');
    const totalCost = Number((dto.quantity * dto.unitPrice).toFixed(2));

    const record = await this.prisma.fuelRecord.create({
      data: {
        schoolId,
        vehicleId: vehicle.id,
        date,
        fuelType: requiredText(dto.fuelType, 'Fuel type'),
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        totalCost,
        mileage: dto.mileage ?? null,
        supplier: optionalText(dto.supplier),
        recordedBy: actorId,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'FUEL_RECORDED',
      module: 'TRANSPORT',
      resourceId: record.id,
      metadata: { vehicle: vehicle.registrationNumber, totalCost },
    });

    return record;
  }
}
