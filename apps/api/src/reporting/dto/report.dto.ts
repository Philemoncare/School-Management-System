import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsObject, IsArray, IsBoolean } from 'class-validator';
import { ReportCategory, ReportVisibility, ReportStatus, ExportFormat, ScheduleFrequency, RecipientType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateReportDefinitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ReportCategory)
  category: ReportCategory;

  @IsEnum(ReportVisibility)
  @IsOptional()
  visibility?: ReportVisibility;

  @IsString()
  @IsOptional()
  requiredPermission?: string;

  @IsUUID()
  @IsOptional()
  datasetId?: string;

  @IsObject()
  config: any;
}

export class UpdateReportDefinitionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsObject()
  @IsNotEmpty()
  config: any;

  @IsString()
  @IsOptional()
  changeDescription?: string;
}

export class CreateReportDatasetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ReportCategory)
  category: ReportCategory;

  @IsString()
  @IsNotEmpty()
  baseModel: string;
}

export class CreateReportFieldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  dataType: string;

  @IsBoolean()
  @IsOptional()
  isSensitive?: boolean;

  @IsString()
  @IsOptional()
  requiredPermission?: string;
}

export class ExecuteReportDto {
  @IsObject()
  @IsOptional()
  parameters?: any;

  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;
}

export class CreateReportScheduleDto {
  @IsUUID()
  @IsNotEmpty()
  reportDefinitionId: string;

  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsOptional()
  dayOfWeek?: number;

  @IsOptional()
  dayOfMonth?: number;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsObject()
  @IsOptional()
  parameters?: any;

  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;

  @IsArray()
  @Type(() => CreateRecipientDto)
  recipients: CreateRecipientDto[];
}

export class CreateRecipientDto {
  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @IsOptional()
  recipientId?: string;

  @IsOptional()
  email?: string;
}
