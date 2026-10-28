import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, Matches } from 'class-validator';

// School status values (define locally since prisma enum may have different names)
export type SchoolStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED' | 'MAINTENANCE';

export class CreateSchoolDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]{3,10}$/, { message: 'Code must be 3-10 alphanumeric characters' })
  code: string = '';

  @IsString()
  @IsOptional()
  slug?: string = undefined;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string = '';

  @IsString()
  @IsNotEmpty()
  adminFirstName: string = '';

  @IsString()
  @IsNotEmpty()
  adminLastName: string = '';

  @IsOptional()
  @IsString()
  phone?: string = undefined;

  @IsOptional()
  @IsString()
  address?: string = undefined;

  @IsOptional()
  @IsString()
  timezone?: string = 'UTC';

  @IsOptional()
  @IsString()
  currency?: string = 'USD';
}
