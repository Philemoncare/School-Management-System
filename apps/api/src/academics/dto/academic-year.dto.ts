import { IsNotEmpty, IsString, IsDate, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { AcademicYearStatus } from '@prisma/client';

export class CreateAcademicYearDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @IsEnum(AcademicYearStatus)
  @IsOptional()
  status?: AcademicYearStatus;
}

export class UpdateAcademicYearDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @IsEnum(AcademicYearStatus)
  @IsOptional()
  status?: AcademicYearStatus;
}
