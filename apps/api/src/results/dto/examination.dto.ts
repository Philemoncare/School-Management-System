import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// ExamPeriodStatus values
export type ExamPeriodStatus = 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'SUBMISSION_OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'LOCKED' | 'CANCELLED';

// ExamSessionStatus values
export type ExamSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// ExamAttendanceStatus values
export type ExamAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'DISQUALIFIED';

export class CreateExamPeriodDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string = '';

  @IsUUID()
  @IsOptional()
  termId?: string = undefined;

  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsNotEmpty()
  code: string = '';

  @IsString()
  @IsOptional()
  description?: string = undefined;

  @IsDate()
  @Type(() => Date)
  startDate: Date = new Date();

  @IsDate()
  @Type(() => Date)
  endDate: Date = new Date();
}

export class CreateExamSessionDto {
  @IsUUID()
  @IsNotEmpty()
  examPeriodId: string = '';

  @IsUUID()
  @IsNotEmpty()
  subjectId: string = '';

  @IsUUID()
  @IsNotEmpty()
  classId: string = '';

  @IsUUID()
  @IsOptional()
  sectionId?: string = undefined;

  @IsDate()
  @Type(() => Date)
  date: Date = new Date();

  @IsString()
  @IsNotEmpty()
  startTime: string = '';

  @IsString()
  @IsNotEmpty()
  endTime: string = '';

  @IsUUID()
  @IsOptional()
  roomId?: string = undefined;

  @IsUUID()
  @IsOptional()
  invigilatorId?: string = undefined;

  @IsString()
  @IsOptional()
  instructions?: string = undefined;
}

export class MarkExamAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string = '';

  @IsString()
  @IsNotEmpty()
  status: string = 'PRESENT';

  @IsString()
  @IsOptional()
  remarks?: string = undefined;
}