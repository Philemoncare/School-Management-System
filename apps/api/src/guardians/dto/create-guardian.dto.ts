import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class CreateGuardianDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;
}

export class LinkGuardianDto {
  @IsUUID()
  @IsNotEmpty()
  guardianId: string;

  @IsString()
  @IsNotEmpty()
  relation: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateLinkGuardianDto {
  @IsString()
  @IsOptional()
  relation?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
