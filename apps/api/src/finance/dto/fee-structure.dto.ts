import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsDate, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeeStructureDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsUUID()
  @IsOptional()
  classId?: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsUUID()
  @IsNotEmpty()
  feeCategoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dueDate: Date;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}
