import { IsNotEmpty, IsOptional, IsUUID, IsNumber, IsEnum, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ScoreStatus } from '@prisma/client';

export class EnterScoreDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rawScore?: number;

  @IsEnum(ScoreStatus)
  @IsOptional()
  status?: ScoreStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkEnterScoresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnterScoreDto)
  scores: EnterScoreDto[];
}
