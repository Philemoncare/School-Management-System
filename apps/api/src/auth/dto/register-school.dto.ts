import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SCHOOL_TYPES } from '../school-registration.constants';

export class SchoolRegistrationDto {
  @IsString()
  @IsNotEmpty({ message: 'School name is required' })
  @MaxLength(160)
  name: string;

  @IsString()
  @IsIn(SCHOOL_TYPES, { message: 'Select a valid school type' })
  type: string;

  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(80)
  country: string;

  @IsString()
  @IsNotEmpty({ message: 'Region is required' })
  @MaxLength(80)
  region: string;

  @IsString()
  @IsNotEmpty({ message: 'Town or district is required' })
  @MaxLength(120)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
  @IsEmail({}, { message: 'School contact email must be a valid email address' })
  @MaxLength(254)
  @IsOptional()
  email?: string;
}

export class AdminRegistrationDto {
  @IsString()
  @IsNotEmpty({ message: 'Administrator full name is required' })
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'Administrator email must be a valid email address' })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/, {
    message: 'Password must contain uppercase, lowercase, numbers and special characters',
  })
  password: string;
}

export class RegisterSchoolRequestDto {
  @IsDefined({ message: 'School information is required' })
  @ValidateNested()
  @Type(() => SchoolRegistrationDto)
  school: SchoolRegistrationDto;

  @IsDefined({ message: 'Administrator information is required' })
  @ValidateNested()
  @Type(() => AdminRegistrationDto)
  admin: AdminRegistrationDto;

  @IsBoolean()
  consentToTerms: boolean;
}
