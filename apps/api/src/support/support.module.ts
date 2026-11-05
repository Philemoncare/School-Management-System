import { Module } from '@nestjs/common';
import { SupportTicketService } from './support-ticket.service';
import { SupportTicketsController } from './support-tickets.controller';
import { SchoolSupportTicketsController } from './school-support-tickets.controller';

/**
 * Standalone module rather than more methods on SuperAdminService: the ticket
 * workflow has both a platform and a tenant surface, which is the same shape
 * SmsModule already uses (sms.controller + school-sms.controller over one
 * service). EmailProvider reaches us through the global CommunicationModule.
 */
@Module({
  controllers: [SupportTicketsController, SchoolSupportTicketsController],
  providers: [SupportTicketService],
  exports: [SupportTicketService],
})
export class SupportModule {}
