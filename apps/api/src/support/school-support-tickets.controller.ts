import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupportTicketService } from './support-ticket.service';
import {
  CreateSchoolSupportTicketDto,
  SupportTicketMessageDto,
  UpdateSupportTicketStatusDto,
} from './dto/support-ticket.dto';

/**
 * The tenant half of the same ticket thread. Every route is scoped by the
 * active school id from TenantGuard - never by a id supplied in the body - and
 * the service re-checks ownership on read, so one school cannot reach another
 * school's ticket even by guessing a uuid.
 */
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles('SCHOOL_ADMIN')
@Controller('school/support/tickets')
export class SchoolSupportTicketsController {
  constructor(private readonly tickets: SupportTicketService) {}

  @Get()
  list(@ActiveSchool() schoolId: string) {
    return this.tickets.listForSchool(schoolId);
  }

  @Post()
  create(
    @ActiveSchool() schoolId: string,
    @Body() dto: CreateSchoolSupportTicketDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.tickets.open(
      {
        subject: dto.subject,
        description: dto.description,
        schoolId,
        category: dto.category,
        priority: dto.priority,
      },
      user.id,
      { platformActor: false, ipAddress: req.ip },
    );
  }

  @Get(':ticketId')
  detail(@ActiveSchool() schoolId: string, @Param('ticketId') ticketId: string) {
    return this.tickets.detail(ticketId, { schoolId, platform: false });
  }

  @Post(':ticketId/messages')
  message(
    @ActiveSchool() schoolId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: SupportTicketMessageDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    // schoolActor forces internal notes off and enforces tenancy inside the
    // service, so a reply here cannot be hidden from the platform.
    return this.tickets.addMessage(ticketId, dto, user.id, {
      schoolActor: true,
      schoolId,
      ipAddress: req.ip,
    });
  }

  @Patch(':ticketId/status')
  status(
    @ActiveSchool() schoolId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateSupportTicketStatusDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.tickets.updateStatus(ticketId, dto, user.id, {
      schoolActor: true,
      schoolId,
      ipAddress: req.ip,
    });
  }
}
