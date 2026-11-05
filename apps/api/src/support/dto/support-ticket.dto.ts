import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@prisma/client';

/**
 * Every field on these classes is declared deliberately: the global
 * ValidationPipe runs with `whitelist: true`, so an undocumented property is
 * stripped before the service ever sees it and the request silently loses data.
 */
export class CreateSupportTicketDto {
  @IsString()
  @MinLength(10)
  @MaxLength(120)
  subject: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  description: string;

  @IsString()
  schoolId: string;

  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsOptional()
  @IsBoolean()
  notifySchoolAdmins?: boolean;
}

/**
 * School-facing variant: the tenant comes from TenantGuard, never from the
 * body, so a school cannot raise a ticket against another school.
 */
export class CreateSchoolSupportTicketDto {
  @IsString()
  @MinLength(10)
  @MaxLength(120)
  subject: string;

  @IsString()
  @MinLength(20)
  @MaxLength(4000)
  description: string;

  @IsOptional()
  @IsEnum(SupportTicketCategory)
  category?: SupportTicketCategory;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;
}

export class AssignSupportTicketDto {
  @IsString()
  assigneeId: string;
}

export class UpdateSupportTicketStatusDto {
  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  note?: string;

  /** Required by the service when moving to RESOLVED. */
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  resolutionNote?: string;
}

export class SupportTicketMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  body: string;

  /**
   * Platform-only note. Never returned to the school and never triggers a
   * notification, so an agent can leave internal context in the thread.
   */
  @IsOptional()
  @IsBoolean()
  internal?: boolean;
}
