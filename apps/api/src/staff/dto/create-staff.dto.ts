import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { StaffStatus } from '@prisma/client';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  employeeId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  designation?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsUUID()
  @IsOptional()
  positionId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  middleName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  employeeId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  designation?: string;

  /** Empty string clears the department. */
  @IsString()
  @IsOptional()
  departmentId?: string;

  /** Empty string clears the position. */
  @IsString()
  @IsOptional()
  positionId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}
