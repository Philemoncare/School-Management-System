import {
  IsArray,
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsInt,
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

  @IsPositive()
  @IsDecimal()
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
  @IsDecimal()
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
