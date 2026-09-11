import { IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;
}

export class MoveStudentDto {
  @IsUUID()
  @IsNotEmpty()
  newClassId: string;

  @IsUUID()
  @IsOptional()
  newSectionId?: string;

  @IsNotEmpty()
  reason: string;
}
