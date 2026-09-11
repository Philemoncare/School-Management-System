import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { SubjectType } from '@prisma/client';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SubjectType)
  @IsOptional()
  subjectType?: SubjectType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSubjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  shortName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SubjectType)
  @IsOptional()
  subjectType?: SubjectType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
