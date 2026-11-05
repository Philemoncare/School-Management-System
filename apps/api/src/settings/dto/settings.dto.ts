import { IsString, IsNotEmpty, IsOptional, IsJSON, IsObject, IsBoolean, IsArray, IsDefined } from 'class-validator';

export class UpdateSettingDto {
  // `value` is persisted into a Json column, so any JSON payload is valid:
  // objects, arrays, strings, numbers and booleans. Presence is still required.
  @IsDefined()
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
