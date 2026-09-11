import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, Matches } from 'class-validator';
import { SchoolStatus } from '@prisma/client';

export class CreateSchoolDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]{3,10}$/, { message: 'Code must be 3-10 alphanumeric characters' })
  code: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  adminFirstName: string;

  @IsString()
  @IsNotEmpty()
  adminLastName: string;

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
