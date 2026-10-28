import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsBoolean, IsArray, IsEnum, IsDate, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType, CalendarEventType } from '@prisma/client';

// TimetableStatus values
export type TimetableStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'ACTIVE';

// EntryStatus values
export type EntryStatus = 'ACTIVE' | 'CANCELLED' | 'REPLACED' | 'COMPLETED';

// SubstitutionStatus values
export type SubstitutionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @IsOptional()
  building?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsOptional()
  facilities?: any;
}

export class CreatePeriodDto {
  @IsInt()
  @Min(1)
  periodNumber: number = 1;

  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:mm format' })
  startTime: string = '';

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be in HH:mm format' })
  endTime: string = '';

  @IsBoolean()
  @IsOptional()
  isBreak?: boolean;

  @IsInt()
  @Min(1)
  duration: number = 1;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(7)
  dayOfWeek?: number;
}

export class CreateBellScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @Type(() => CreatePeriodDto)
  periods: CreatePeriodDto[];
}

export class CreateTimetableEntryDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string = '';

  @IsUUID()
  @IsOptional()
  termId?: string = undefined;

  @IsUUID()
  @IsOptional()
  versionId?: string = undefined;

  @IsUUID()
  @IsNotEmpty()
  classId: string = '';

  @IsUUID()
  @IsOptional()
  sectionId?: string = undefined;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string = '';

  @IsUUID()
  @IsNotEmpty()
  teacherId: string = '';

  @IsUUID()
  @IsOptional()
  teacherAssignmentId?: string = undefined;

  @IsUUID()
  @IsOptional()
  roomId?: string = undefined;

  @IsUUID()
  @IsOptional()
  periodId?: string = undefined;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number = 1;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:mm format' })
  startTime: string = '';

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be in HH:mm format' })
  endTime: string = '';
}

export class CreateTimetableVersionDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string = '';

  @IsUUID()
  @IsOptional()
  termId?: string = undefined;

  @IsInt()
  @Min(1)
  versionNumber: number = 1;

  @IsString()
  @IsOptional()
  name?: string = '';
}

export class CreateSubstitutionDto {
  @IsUUID()
  @IsNotEmpty()
  timetableEntryId: string = '';

  @IsUUID()
  @IsNotEmpty()
  originalTeacherId: string = '';

  @IsUUID()
  @IsNotEmpty()
  substituteTeacherId: string = '';

  @IsDate()
  @Type(() => Date)
  date: Date = new Date();

  @IsString()
  @IsOptional()
  reason?: string = '';
}

export class CreateCalendarEventDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string = '';

  @IsUUID()
  @IsOptional()
  termId?: string = undefined;

  @IsString()
  @IsNotEmpty()
  title: string = '';

  @IsString()
  @IsOptional()
  description?: string = undefined;

  @IsDate()
  @Type(() => Date)
  startDate: Date = new Date();

  @IsDate()
  @Type(() => Date)
  endDate: Date = new Date();

  @IsEnum(CalendarEventType)
  type: CalendarEventType;
}
