import { IsNotEmpty, IsOptional, IsUUID, IsDate, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  dueDate: Date;

  @IsArray()
  @IsOptional()
  feeStructureIds?: string[];

  @IsString()
  @IsOptional()
  currency?: string;
}
