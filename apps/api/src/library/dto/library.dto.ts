import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator';
import { BookCondition, BookCopyStatus, LoanStatus, ReservationStatus, FineStatus } from '@prisma/client';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  isbn?: string;

  @IsString()
  @IsOptional()
  edition?: string;

  @IsNumber()
  @IsOptional()
  publicationYear?: number;

  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  publisherId?: string;

  @IsArray()
  @IsOptional()
  authorIds?: string[];
}

export class CreateBookCopyDto {
  @IsUUID()
  @IsNotEmpty()
  bookId: string;

  @IsString()
  @IsNotEmpty()
  accessionNumber: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsEnum(BookCondition)
  @IsOptional()
  condition?: BookCondition;

  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  shelf?: string;
}

export class IssueBookDto {
  @IsUUID()
  @IsNotEmpty()
  membershipId: string;

  @IsUUID()
  @IsNotEmpty()
  bookCopyId: string;

  @IsOptional()
  dueDate?: Date;
}

export class ReturnBookDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(BookCondition)
  @IsOptional()
  condition?: BookCondition;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateAuthorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  biography?: string;
}

export class CreatePublisherDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  website?: string;
}

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateAuthorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  biography?: string;
}

export class UpdatePublisherDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  website?: string;
}

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
