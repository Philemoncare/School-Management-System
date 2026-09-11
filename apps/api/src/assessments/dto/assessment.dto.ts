import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsDate, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentStatus } from '@prisma/client';

export class CreateAssessmentDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsUUID()
  @IsNotEmpty()
  assessmentTypeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsUUID()
  @IsOptional()
  examPeriodId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsNumber()
  @Min(0)
  totalMarks: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  weight?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsEnum(AssessmentStatus)
  @IsOptional()
  status?: AssessmentStatus;
}

export class UpdateAssessmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  totalMarks?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsEnum(AssessmentStatus)
  @IsOptional()
  status?: AssessmentStatus;
}
