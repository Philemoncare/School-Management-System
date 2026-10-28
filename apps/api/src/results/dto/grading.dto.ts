import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGradeBandDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  minimumPercentage: number = 0;

  @IsNumber()
  @Min(0)
  @Max(100)
  maximumPercentage: number = 100;

  @IsString()
  @IsNotEmpty()
  grade: string = '';

  @IsNumber()
  @IsOptional()
  gradePoint?: number = undefined;

  @IsString()
  @IsOptional()
  remark?: string = undefined;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  sequence?: number = 0;
}

export class CreateGradingScaleDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsNotEmpty()
  code: string = '';

  @IsString()
  @IsOptional()
  description?: string = undefined;

  @IsUUID()
  @IsOptional()
  policyId?: string = undefined;

  @IsBoolean()
  @IsOptional()
  status?: boolean = undefined;

  @IsArray()
  @Type(() => CreateGradeBandDto)
  gradeBands: CreateGradeBandDto[] = [];
}

export class UpdateGradingScaleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  policyId?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @IsArray()
  @IsOptional()
  @Type(() => CreateGradeBandDto)
  gradeBands?: CreateGradeBandDto[];
}

export class CreateGradingPolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @IsString()
  @IsOptional()
  description?: string = undefined;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = undefined;

  @IsOptional()
  calculationRules?: any = undefined;
}