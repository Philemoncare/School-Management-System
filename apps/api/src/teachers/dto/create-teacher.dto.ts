import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsPhoneNumber, IsDateString, IsInt, Min, Max } from 'class-validator';
import { StaffStatus } from '@prisma/client';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  positionId?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsDateString()
  @IsOptional()
  dateOfJoining?: string;

  @IsInt()
  @Min(0)
  @Max(60)
  @IsOptional()
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  bankAccountName?: string;

  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @IsString()
  @IsOptional()
  bankName?: string;
}
