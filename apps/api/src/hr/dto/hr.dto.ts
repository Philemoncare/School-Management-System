import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDate, IsEnum, IsArray, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StaffStatus, StaffAttendanceStatus, LeaveRequestStatus, OnboardingStatus, VerificationStatus } from '@prisma/client';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  headStaffId?: string;

  @IsUUID()
  @IsOptional()
  headTeacherId?: string;
}

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;
}

export class CreateEmploymentRecordDto {
  @IsUUID()
  @IsOptional()
  staffId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsNotEmpty()
  employmentType: string;

  @IsUUID()
  @IsOptional()
  positionId?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsDate()
  @Type(() => Date)
  dateJoined: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  probationEnd?: Date;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateLeaveTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  allowanceDays: number;

  @IsString()
  @IsOptional()
  accrualMethod?: string;

  @IsBoolean()
  @IsOptional()
  requiresDocuments?: boolean;
}

export class CreateLeaveRequestDto {
  @IsUUID()
  @IsNotEmpty()
  leaveTypeId: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  @IsOptional()
  staffId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}

export class MarkStaffAttendanceDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsEnum(StaffAttendanceStatus)
  status: StaffAttendanceStatus;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  checkIn?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  checkOut?: Date;

  @IsUUID()
  @IsOptional()
  staffId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateStaffDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentType: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsUUID()
  @IsOptional()
  staffId?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
