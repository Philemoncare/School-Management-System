import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BillingInterval,
  MaintenanceStatus,
  NotificationPriority,
  PlanStatus,
  SchoolStatus,
  SubscriptionStatus,
} from '@prisma/client';

export class ProvisionSchoolDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  code: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  schoolType?: string;

  @IsOptional()
  @IsEnum(SchoolStatus)
  status?: SchoolStatus;

  @IsString()
  @MinLength(2)
  adminFirstName: string;

  @IsString()
  @MinLength(2)
  adminLastName: string;

  @IsEmail()
  adminEmail: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  adminPassword?: string;

  @IsOptional()
  @IsString()
  planId?: string;
}

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  schoolType?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}

export class UpdateSchoolStatusDto {
  @IsEnum(SchoolStatus)
  status: SchoolStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignSubscriptionDto {
  @IsString()
  planId: string;

  @IsOptional()
  @IsString()
  pricingId?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ResetUserPasswordDto {
  @IsString()
  @MinLength(12)
  newPassword: string;
}

export class PlanPricingDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(BillingInterval)
  interval: BillingInterval;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanPricingDto)
  pricing: PlanPricingDto[];
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanPricingDto)
  pricing?: PlanPricingDto[];
}

export class CreateMaintenanceWindowDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  affectedServices: string[];

  @IsString()
  startAt: string;

  @IsString()
  endAt: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsBoolean()
  allSchools?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  schoolIds?: string[];
}

export class UpdateMaintenanceWindowDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedServices?: string[];

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsBoolean()
  allSchools?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  schoolIds?: string[];
}

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  content: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsBoolean()
  publishImmediately?: boolean;

  @IsOptional()
  @IsString()
  publishAt?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  allSchools?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  schoolIds?: string[];

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class UpdateSecurityIncidentDto {
  @IsIn(['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'])
  status: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateSecurityPolicyDto {
  @IsOptional()
  @IsInt()
  @Min(6)
  passwordMinLength?: number;

  @IsOptional()
  @IsBoolean()
  passwordRequireUpper?: boolean;

  @IsOptional()
  @IsBoolean()
  passwordRequireNumber?: boolean;

  @IsOptional()
  @IsBoolean()
  passwordRequireSymbol?: boolean;

  @IsOptional()
  @IsString()
  mfaEnforcement?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  sessionTimeoutMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  idleTimeoutMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxConcurrentSessions?: number;

  @IsOptional()
  @IsInt()
  @Min(3)
  lockoutThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  lockoutDurationMinutes?: number;
}

export class CreateSupportAccessDto {
  @IsString()
  schoolId: string;

  @IsString()
  @MinLength(10)
  reason: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes?: number;
}

export class AssignPlatformRoleDto {
  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

// SMS credit grants are described once, by GrantSmsCreditsDto in
// src/sms/dto/sms-package.dto. A second "amount" shaped DTO here used to let
// callers mint an arbitrary number of credits, which is why the platform
// duplicate was removed rather than extended.

export class SmsCreditDto {
  @IsString()
  schoolId: string;

  @IsString()
  schoolName: string;

  @IsNumber()
  smsCreditBalance: number;

  @IsString()
  currency: string;

  @IsString()
  status: string;
}
