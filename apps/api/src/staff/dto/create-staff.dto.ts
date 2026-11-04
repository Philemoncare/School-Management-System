import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { StaffStatus } from '@prisma/client';

const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED'];
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'CASUAL', 'INTERN', 'VOLUNTEER'];

/** Shared personal/contact/employment fields for create + update. */
class StaffDetailsDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  altPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  gender?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  photoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  emergencyContactRelationship?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  employmentType?: string;

  @IsDateString()
  @IsOptional()
  appointmentDate?: string;

  @IsDateString()
  @IsOptional()
  commencementDate?: string;

  @IsDateString()
  @IsOptional()
  contractEndDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  responsibilities?: string;

  @IsUUID()
  @IsOptional()
  supervisorStaffId?: string;
}

export class CreateStaffDto extends StaffDetailsDto {
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

export class UpdateStaffDto extends StaffDetailsDto {
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

export { GENDER_VALUES, EMPLOYMENT_TYPES };
