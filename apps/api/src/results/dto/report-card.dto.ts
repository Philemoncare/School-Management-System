import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsArray } from 'class-validator';

export class GenerateReportCardsDto {
  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsArray()
  @IsOptional()
  studentIds?: string[];
}

export class UpdateReportCardCommentsDto {
  @IsString()
  @IsOptional()
  teacherComment?: string;

  @IsString()
  @IsOptional()
  principalComment?: string;
}
