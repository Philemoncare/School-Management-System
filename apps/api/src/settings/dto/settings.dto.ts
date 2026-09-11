import { IsString, IsNotEmpty, IsOptional, IsJSON, IsObject, IsBoolean } from 'class-validator';

export class UpdateSettingDto {
  @IsObject()
  @IsNotEmpty()
  value: any;

  @IsString()
  @IsOptional()
  changeReason?: string;
}

export class CreateFeatureFlagDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  allSchools?: boolean;
}

export class UpdateFeatureFlagDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class SetNumberingRuleDto {
  @IsString()
  @IsOptional()
  prefix?: string;

  @IsString()
  @IsOptional()
  suffix?: string;

  @IsNotEmpty()
  padding: number;

  @IsBoolean()
  includeYear: boolean;
}
