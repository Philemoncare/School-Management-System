import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { VerificationStatus } from '@prisma/client';

export class CreateTeacherCertificationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  issuingOrganization: string;

  @IsString()
  @IsOptional()
  certificateNumber?: string;

  @Type(() => Date)
  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;
}

export class UpdateTeacherCertificationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  issuingOrganization?: string;

  @IsString()
  @IsOptional()
  certificateNumber?: string;

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsEnum(VerificationStatus)
  @IsOptional()
  verificationStatus?: VerificationStatus;
}
