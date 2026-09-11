import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDate, IsEnum, IsArray, IsNumber, IsBoolean, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignStatus, ApplicationStatus, DecisionType, OfferStatus, InterviewStatus } from '@prisma/client';

export class CreateCampaignDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsDate()
  @Type(() => Date)
  applicationOpenDate: Date;

  @IsDate()
  @Type(() => Date)
  applicationCloseDate: Date;

  @IsNumber()
  @IsOptional()
  applicationFee?: number;

  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateApplicationGuardianDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class SubmitApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  campaignId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsArray()
  @Type(() => CreateApplicationGuardianDto)
  guardians: CreateApplicationGuardianDto[];
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateDecisionDto {
  @IsEnum(DecisionType)
  decision: DecisionType;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOfferDto {
  @IsDate()
  @Type(() => Date)
  expiryDate: Date;

  @IsString()
  @IsOptional()
  conditions?: string;
}

export class ScheduleInterviewDto {
  @IsUUID()
  @IsNotEmpty()
  interviewerId: string;

  @IsDate()
  @Type(() => Date)
  scheduledDate: Date;

  @IsString()
  @IsOptional()
  location?: string;
}
