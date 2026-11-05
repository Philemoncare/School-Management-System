import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseStatus, SmsPackageStatus } from '@prisma/client';

export class CreateSmsPackageDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  credits: number;

  /**
   * Money is sent as a JSON number. `@IsDecimal()` rejected every package
   * because class-validator's decimal check only accepts strings, which made
   * the whole SMS catalogue impossible to populate through the API.
   */
  @IsPositive()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(SmsPackageStatus)
  status?: SmsPackageStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateSmsPackageDto {
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
  @IsInt()
  @Min(1)
  credits?: number;

  @IsOptional()
  @IsPositive()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(SmsPackageStatus)
  status?: SmsPackageStatus;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class SmsPackageResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  price: number;
  currency: string;
  status: SmsPackageStatus;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchaseSmsCreditsDto {
  @IsString()
  packageId: string;
}

/**
 * A platform-side credit allocation.
 *
 * Declared as a class rather than an inline type because the global
 * ValidationPipe runs with `whitelist`, which silently strips any field it has
 * not seen a decorator for — an inline type would arrive with an empty body.
 *
 * Credits are never taken from the caller: they come from the package record,
 * so a grant can only ever be a package that actually exists in the catalogue.
 */
export class GrantSmsCreditsDto {
  @IsString()
  schoolId: string;

  @IsString()
  packageId: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}

/**
 * Platform confirmation that payment for a school-initiated purchase has
 * actually been received. `reference` is what makes the confirmation
 * attributable, so it is required rather than optional.
 */
export class ConfirmSmsPurchaseDto {
  @IsString()
  @MinLength(3)
  reference: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SmsCreditPurchaseResponseDto {
  id: string;
  packageId: string;
  packageName: string;
  credits: number;
  amount: number;
  currency: string;
  status: PurchaseStatus;
  purchasedAt: Date;
  completedAt?: Date;
}

export class SchoolSmsBalanceDto {
  schoolId: string;
  schoolName: string;
  smsCreditBalance: number;
  currency: string;
  status: string;
}

export class SmsCreditTransactionDto {
  id: string;
  type: 'PURCHASE' | 'USAGE';
  amount: number;
  credits: number;
  balanceAfter: number;
  currency: string;
  description: string;
  createdAt: Date;
  reference?: string;
}
