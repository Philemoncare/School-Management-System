import { IsString, IsOptional, IsEnum, IsArray, IsObject, MinLength } from 'class-validator';
import { SearchableEntityType } from '@prisma/client';

export class GlobalSearchDto {
  @IsString()
  @MinLength(2)
  q: string;

  @IsOptional()
  @IsEnum(SearchableEntityType, { each: true })
  @IsArray()
  entities?: SearchableEntityType[];

  @IsOptional()
  @IsString()
  module?: string;
}

export class AdvancedSearchDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsEnum(SearchableEntityType)
  entity: SearchableEntityType;

  @IsObject()
  filters: any;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class SaveSearchDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsObject()
  filters?: any;

  @IsOptional()
  @IsEnum(SearchableEntityType, { each: true })
  @IsArray()
  entityScope?: SearchableEntityType[];
}

export interface SearchResult {
  id: string;
  entityType: SearchableEntityType;
  title: string;
  subtitle?: string;
  status?: string;
  module: string;
  relevanceScore?: number;
  route: string;
  allowedActions: string[];
  metadata?: any;
}
