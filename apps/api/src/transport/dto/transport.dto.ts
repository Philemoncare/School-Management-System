import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber, IsUUID, IsEnum, IsArray, IsDate, Min } from "class-validator";
import { Type } from "class-transformer";
import { RouteDirection, VehicleStatus, DriverStatus, AttendanceType, TransportAttendanceStatus } from "@prisma/client";

// Route status values
export type RouteStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'MAINTENANCE';

// Trip status values
export type TripStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED' | 'PENDING';

// Maintenance status values
export type MaintenanceStatus = 'ACTIVE' | 'INACTIVE' | 'REPAIR' | 'MAINTENANCE';

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