import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { VerificationStatus } from '@prisma/client';

export class CreateTeacherQualificationDto {
  @IsString()
  @IsNotEmpty()
  institution: string;

  @IsString()
  @IsNotEmpty()
  qualification: string;

  @IsString()
  @IsNotEmpty()
  fieldOfStudy: string;

  @Type(() => Date)
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;
}

export class UpdateTeacherQualificationDto {
  @IsString()
  @IsOptional()
  institution?: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsString()
  @IsOptional()
  fieldOfStudy?: string;

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @IsString()
  @IsOptional()
  grade?: string;

  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;
}
