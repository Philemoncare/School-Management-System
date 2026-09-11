import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';
import { SchoolStatus } from '@prisma/client';

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logo?: string;

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
}

export class UpdateSchoolStatusDto {
  @IsEnum(SchoolStatus)
  status: SchoolStatus;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

import { IsNotEmpty } from 'class-validator';
