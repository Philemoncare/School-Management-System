import { IsNotEmpty, IsEnum, IsOptional, IsString, IsUUID, IsInt, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';

export class MarkAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @Type(() => Date)
  @IsOptional()
  checkInTime?: Date;

  @Type(() => Date)
  @IsOptional()
  checkOutTime?: Date;

  @IsInt()
  @Min(0)
  @IsOptional()
  minutesLate?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkMarkAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceDto)
  records: MarkAttendanceDto[];
}
