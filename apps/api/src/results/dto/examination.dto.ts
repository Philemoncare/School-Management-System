import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDate, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ExamPeriodStatus, ExamSessionStatus, ExamAttendanceStatus } from '@prisma/client';

export class CreateExamPeriodDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;
}

export class CreateExamSessionDto {
  @IsUUID()
  @IsNotEmpty()
  examPeriodId: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsUUID()
  @IsOptional()
  roomId?: string;

  @IsUUID()
  @IsOptional()
  invigilatorId?: string;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class MarkExamAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(ExamAttendanceStatus)
  status: ExamAttendanceStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}
