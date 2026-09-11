import { IsNotEmpty, IsOptional, IsString, IsDate, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
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
  @IsNotEmpty()
  studentNumber: string;

  @IsString()
  @IsOptional()
  admissionNumber?: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  admissionDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dateOfBirth: Date;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsEnum(StudentStatus)
  @IsOptional()
  status?: StudentStatus;

  @IsUUID()
  @IsOptional()
  userId?: string;
}
