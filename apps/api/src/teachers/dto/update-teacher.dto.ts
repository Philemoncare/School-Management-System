import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsEnum } from 'class-validator';
import { StaffStatus } from '@prisma/client';

export class UpdateTeacherDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  middleName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  employeeId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  specialization?: string;

  /** Empty string clears the department. */
  @IsString()
  @IsOptional()
  departmentId?: string;

  /** Empty string clears the position. */
  @IsString()
  @IsOptional()
  positionId?: string;

  @IsEnum(StaffStatus)
  @IsOptional()
  status?: StaffStatus;
}
