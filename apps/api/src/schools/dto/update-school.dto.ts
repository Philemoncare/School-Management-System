import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// School status values (define locally since prisma enum may have different names)
export type SchoolStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED' | 'MAINTENANCE';

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  name?: string = undefined;

  @IsOptional()
  @IsString()
  logo?: string = undefined;

  @IsOptional()
  @IsEmail()
  email?: string = undefined;

  @IsOptional()
  @IsString()
  phone?: string = undefined;

  @IsOptional()
  @IsString()
  address?: string = undefined;

  @IsOptional()
  @IsString()
  timezone?: string = undefined;

  @IsOptional()
  @IsString()
  currency?: string = undefined;
}

export class UpdateSchoolStatusDto {
  @IsString()
  status: string = 'ACTIVE';

  @IsString()
  @IsNotEmpty()
  reason: string = '';
}