import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGradeBandDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  minimumPercentage: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maximumPercentage: number;

  @IsString()
  @IsNotEmpty()
  grade: string;

  @IsNumber()
  @IsOptional()
  gradePoint?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsNumber()
  @IsOptional()
  sequence?: number;
}

export class CreateGradingScaleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  policyId?: string;

  @IsArray()
  @Type(() => CreateGradeBandDto)
  gradeBands: CreateGradeBandDto[];
}

export class CreateGradingPolicyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsOptional()
  calculationRules?: any;
}
