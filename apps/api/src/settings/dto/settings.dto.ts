import { IsString, IsNotEmpty, IsOptional, IsJSON, IsObject, IsBoolean, IsArray } from 'class-validator';

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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  schoolIds?: string[];
}

export class UpdateFeatureFlagDto {
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  allSchools?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  schoolIds?: string[];
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
