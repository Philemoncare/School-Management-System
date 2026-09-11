import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsBoolean, IsArray, IsEnum, IsDate, Min, Max, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { RoomType, CalendarEventType, TimetableStatus, EntryStatus, SubstitutionStatus } from '@prisma/client';

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
  periodNumber: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @IsBoolean()
  @IsOptional()
  isBreak?: boolean;

  @IsInt()
  @Min(1)
  duration: number;

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
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsUUID()
  @IsOptional()
  versionId?: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @IsUUID()
  @IsOptional()
  teacherAssignmentId?: string;

  @IsUUID()
  @IsOptional()
  roomId?: string;

  @IsUUID()
  @IsOptional()
  periodId?: string;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;
}

export class CreateTimetableVersionDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsInt()
  @Min(1)
  versionNumber: number;

  @IsString()
  @IsOptional()
  name?: string;
}

export class CreateSubstitutionDto {
  @IsUUID()
  @IsNotEmpty()
  timetableEntryId: string;

  @IsUUID()
  @IsNotEmpty()
  originalTeacherId: string;

  @IsUUID()
  @IsNotEmpty()
  substituteTeacherId: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateCalendarEventDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsEnum(CalendarEventType)
  type: CalendarEventType;
}
