import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsPhoneNumber } from 'class-validator';
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
}
