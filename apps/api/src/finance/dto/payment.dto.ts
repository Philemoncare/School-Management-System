import { IsNotEmpty, IsNumber, IsEnum, IsString, IsOptional, IsUUID, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class RecordPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  externalReference?: string;

  @IsArray()
  @IsOptional()
  allocations?: { invoiceId: string; amount: number }[];
}
