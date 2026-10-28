import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsUUID,
  IsEnum,
  IsDate,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import {
  RouteDirection,
  RouteStatus,
  VehicleStatus,
  DriverStatus,
  AttendanceType,
  TransportAttendanceStatus,
  TransportAssignmentStatus,
} from "@prisma/client";

// Route status values
export type RouteStatusValue = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'MAINTENANCE';

// Trip status values
export type TripStatusValue = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED' | 'PENDING';

// Maintenance status values
export type MaintenanceStatusValue = 'ACTIVE' | 'INACTIVE' | 'REPAIR' | 'MAINTENANCE';

// Emergency type values
export type EmergencyType = 'MEDICAL' | 'ACCIDENT' | 'FIRE' | 'WEATHER' | 'SECURITY' | 'OTHER';

// Emergency severity values
export type EmergencySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Emergency status values
export type EmergencyStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  registrationNumber: string = '';

  @IsString()
  @IsOptional()
  make?: string = undefined;

  @IsString()
  @IsOptional()
  model?: string = undefined;

  @IsInt()
  @IsOptional()
  year?: number = undefined;

  @IsString()
  @IsOptional()
  type?: string = undefined;

  @IsInt()
  @Min(1)
  seatingCapacity: number = 0;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus = VehicleStatus.AVAILABLE;

  @IsNumber()
  @IsOptional()
  currentMileage?: number = undefined;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  acquisitionDate?: Date = undefined;

  @IsNumber()
  @IsOptional()
  acquisitionCost?: number = undefined;

  @IsString()
  @IsOptional()
  insuranceNumber?: string = undefined;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  insuranceExpiry?: Date = undefined;

  @IsString()
  @IsOptional()
  notes?: string = undefined;
}

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  registrationNumber?: string = undefined;

  @IsString()
  @IsOptional()
  make?: string = undefined;

  @IsString()
  @IsOptional()
  model?: string = undefined;

  @IsInt()
  @IsOptional()
  year?: number = undefined;

  @IsString()
  @IsOptional()
  type?: string = undefined;

  @IsInt()
  @Min(1)
  @IsOptional()
  seatingCapacity?: number = undefined;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus = undefined;

  @IsNumber()
  @IsOptional()
  currentMileage?: number = undefined;

  @IsString()
  @IsOptional()
  insuranceNumber?: string = undefined;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  insuranceExpiry?: Date = undefined;

  @IsString()
  @IsOptional()
  notes?: string = undefined;
}

// Driver DTOs
export class CreateDriverDto {
  @IsUUID()
  @IsNotEmpty()
  staffId: string = '';

  @IsString()
  @IsNotEmpty()
  licenseNumber: string = '';

  @IsString()
  @IsNotEmpty()
  licenseClass: string = '';

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  licenseExpiry: Date = new Date();

  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus = DriverStatus.ACTIVE;

  @IsString()
  @IsOptional()
  notes?: string = undefined;
}

export class UpdateDriverDto {
  @IsString()
  @IsOptional()
  licenseNumber?: string = undefined;

  @IsString()
  @IsOptional()
  licenseClass?: string = undefined;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  licenseExpiry?: Date = undefined;

  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus = undefined;

  @IsString()
  @IsOptional()
  notes?: string = undefined;
}

// Route DTOs
export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsOptional()
  code?: string = undefined;

  @IsString()
  @IsOptional()
  description?: string = undefined;

  @IsEnum(RouteDirection)
  @IsOptional()
  direction?: RouteDirection = undefined;

  @IsInt()
  @IsOptional()
  estimatedDuration?: number = undefined;

  @IsNumber()
  @IsOptional()
  estimatedDistance?: number = undefined;
}

export class UpdateRouteDto {
  @IsString()
  @IsOptional()
  name?: string = undefined;

  @IsString()
  @IsOptional()
  code?: string = undefined;

  @IsString()
  @IsOptional()
  description?: string = undefined;

  @IsEnum(RouteDirection)
  @IsOptional()
  direction?: RouteDirection = undefined;

  @IsEnum(RouteStatus)
  @IsOptional()
  status?: RouteStatus = undefined;

  @IsInt()
  @IsOptional()
  estimatedDuration?: number = undefined;

  @IsNumber()
  @IsOptional()
  estimatedDistance?: number = undefined;
}

// Stop DTOs
export class CreateStopDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsOptional()
  address?: string = undefined;

  @IsNumber()
  @IsOptional()
  latitude?: number = undefined;

  @IsNumber()
  @IsOptional()
  longitude?: number = undefined;

  @IsInt()
  @IsNotEmpty()
  sequence: number = 1;

  @IsString()
  @IsOptional()
  estimatedArrivalTime?: string = undefined;
}

// Assignment DTOs
export class CreateAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string = '';

  @IsUUID()
  @IsNotEmpty()
  routeId: string = '';

  @IsUUID()
  @IsOptional()
  pickupStopId?: string = undefined;

  @IsUUID()
  @IsOptional()
  dropoffStopId?: string = undefined;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  effectiveDate?: Date = undefined;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date = undefined;

  @IsNumber()
  @IsOptional()
  feeAmount?: number = undefined;
}

export class UpdateAssignmentDto {
  @IsEnum(TransportAssignmentStatus)
  @IsOptional()
  status?: TransportAssignmentStatus;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}

// Trip DTOs
export class ScheduleTripDto {
  @IsUUID()
  @IsNotEmpty()
  routeId: string = '';

  @IsUUID()
  @IsNotEmpty()
  vehicleId: string = '';

  @IsUUID()
  @IsNotEmpty()
  driverId: string = '';

  @IsUUID()
  @IsOptional()
  scheduleId?: string = undefined;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  date: Date = new Date();
}

// Attendance DTOs
export class MarkAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string = '';

  @IsUUID()
  @IsOptional()
  stopId?: string = undefined;

  @IsEnum(AttendanceType)
  @IsNotEmpty()
  type: AttendanceType = AttendanceType.PICKUP;

  @IsEnum(TransportAttendanceStatus)
  @IsNotEmpty()
  status: TransportAttendanceStatus = TransportAttendanceStatus.BOARDED;

  @IsNumber()
  @IsOptional()
  latitude?: number = undefined;

  @IsNumber()
  @IsOptional()
  longitude?: number = undefined;
}

// Maintenance DTOs
export class CreateMaintenanceDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string = '';

  @IsString()
  @IsNotEmpty()
  type: string = '';

  @IsString()
  @IsOptional()
  description?: string = undefined;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  scheduledDate: Date = new Date();

  @IsNumber()
  @IsOptional()
  cost?: number = undefined;

  @IsString()
  @IsOptional()
  provider?: string = undefined;

  @IsNumber()
  @IsOptional()
  mileage?: number = undefined;

  @IsString()
  @IsOptional()
  notes?: string = undefined;
}

export class UpdateMaintenanceDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  completedDate?: Date;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Fuel DTOs
export class CreateFuelRecordDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string = '';

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  date: Date = new Date();

  @IsString()
  @IsNotEmpty()
  fuelType: string = '';

  @IsNumber()
  @Min(0.01)
  quantity: number = 0;

  @IsNumber()
  @Min(0)
  unitPrice: number = 0;

  @IsNumber()
  @IsOptional()
  mileage?: number = undefined;

  @IsString()
  @IsOptional()
  supplier?: string = undefined;
}
