import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsEnum,
  IsUUID,
} from 'class-validator';
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

  // Optional: when omitted the API allocates the next number from the
  // school's numbering rules (SettingsService.generateNextNumber).
  @IsString()
  @IsOptional()
  studentNumber?: string;

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

  // Optional first enrollment, so "register student and place them in a class"
  // is one atomic action instead of two unrelated screens.
  @IsUUID()
  @IsOptional()
  academicYearId?: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;
}
