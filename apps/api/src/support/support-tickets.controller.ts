import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PLATFORM_READ_ROLES } from '../auth/platform-roles';
import { SupportTicketService } from './support-ticket.service';
import {
  AssignSupportTicketDto,
  CreateSupportTicketDto,
  SupportTicketMessageDto,
  UpdateSupportTicketStatusDto,
} from './dto/support-ticket.dto';

/**
 * Ticket handling is the PLATFORM_SUPPORT_ADMIN's actual job, so the workflow
 * verbs are open to that role as well as operations and super admins. Nothing
 * here is destructive: there is no delete route, a ticket is closed rather than
 * removed, which is what keeps resolution history intact.
 */
const TICKET_WORKFLOW_ROLES = PLATFORM_READ_ROLES;

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_READ_ROLES)
@Controller('super-admin/tickets')
export class SupportTicketsController {
  constructor(private readonly tickets: SupportTicketService) {}

  @Get()
  list(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('schoolId') schoolId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('unassigned') unassigned?: string,
    @Query('search') search?: string,
  ) {
    return this.tickets.list({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      status,
      priority,
      category,
      schoolId,
      assignedToId,
      unassigned,
      search,
    });
  }

  @Get('metrics')
  metrics() {
    return this.tickets.metrics();
  }

  // Declared after the static segments above: Nest matches routes in
  // declaration order, so ':ticketId' first would swallow "metrics".
  @Get(':ticketId')
  detail(@Param('ticketId') ticketId: string) {
    return this.tickets.detail(ticketId, { platform: true });
  }

  @Post()
  @Roles(...TICKET_WORKFLOW_ROLES)
  create(@Body() dto: CreateSupportTicketDto, @CurrentUser() user: any, @Req() req: any) {
    return this.tickets.open(
      {
        subject: dto.subject,
        description: dto.description,
        schoolId: dto.schoolId,
        category: dto.category,
        priority: dto.priority,
        notifySchoolAdmins: dto.notifySchoolAdmins,
      },
      user.id,
      { platformActor: true, ipAddress: req.ip },
    );
  }

  @Patch(':ticketId/assign')
  @Roles(...TICKET_WORKFLOW_ROLES)
  assign(
    @Param('ticketId') ticketId: string,
    @Body() dto: AssignSupportTicketDto,
    @CurrentUser() user: any,
  ) {
    return this.tickets.assign(ticketId, dto.assigneeId, user.id);
  }

  @Patch(':ticketId/status')
  @Roles(...TICKET_WORKFLOW_ROLES)
  updateStatus(
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateSupportTicketStatusDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.tickets.updateStatus(ticketId, dto, user.id, { ipAddress: req.ip });
  }

  @Post(':ticketId/messages')
  @Roles(...TICKET_WORKFLOW_ROLES)
  message(
    @Param('ticketId') ticketId: string,
    @Body() dto: SupportTicketMessageDto,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.tickets.addMessage(ticketId, dto, user.id, { ipAddress: req.ip });
  }
}
