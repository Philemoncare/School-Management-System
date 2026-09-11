import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsUUID,
  IsEnum,
  IsArray,
  IsDate,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import {
  VehicleStatus,
  DriverStatus,
  RouteDirection,
  RouteStatus,
  TripStatus,
  AttendanceType,
  TransportAttendanceStatus,
  MaintenanceStatus,
  EmergencyType,
  EmergencySeverity,
  EmergencyStatus,
} from "@prisma/client";

// Vehicle DTOs
export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsInt()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsInt()
  @Min(1)
  seatingCapacity: number;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @IsNumber()
  @IsOptional()
  currentMileage?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  acquisitionDate?: Date;

  @IsNumber()
  @IsOptional()
  acquisitionCost?: number;

  @IsString()
  @IsOptional()
  insuranceNumber?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  insuranceExpiry?: Date;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Driver DTOs
export class CreateDriverDto {
  @IsUUID()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @IsString()
  @IsNotEmpty()
  licenseClass: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  licenseExpiry: Date;

  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

// Route DTOs
export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RouteDirection)
  @IsOptional()
  direction?: RouteDirection;

  @IsInt()
  @IsOptional()
  estimatedDuration?: number;

  @IsNumber()
  @IsOptional()
  estimatedDistance?: number;
}

export class CreateStopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsInt()
  @IsNotEmpty()
  sequence: number;

  @IsString()
  @IsOptional()
  estimatedArrivalTime?: string;
}

// Assignment DTOs
export class CreateAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @IsUUID()
  @IsOptional()
  pickupStopId?: string;

  @IsUUID()
  @IsOptional()
  dropoffStopId?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  effectiveDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsNumber()
  @IsOptional()
  feeAmount?: number;
}

// Trip DTOs
export class ScheduleTripDto {
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @IsUUID()
  @IsNotEmpty()
  driverId: string;

  @IsUUID()
  @IsOptional()
  scheduleId?: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  date: Date;
}

// Attendance DTOs
export class MarkAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsOptional()
  stopId?: string;

  @IsEnum(AttendanceType)
  @IsNotEmpty()
  type: AttendanceType;

  @IsEnum(TransportAttendanceStatus)
  @IsNotEmpty()
  status: TransportAttendanceStatus;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
