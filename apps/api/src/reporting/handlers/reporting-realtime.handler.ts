import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../../workflow/events/event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { CommunicationGateway } from '../../communication/gateways/communication.gateway';

@Injectable()
export class ReportingRealtimeHandler implements EventHandler {
  private readonly logger = new Logger(ReportingRealtimeHandler.name);

  constructor(private gateway: CommunicationGateway) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { eventType, schoolId } = event;

    if (!schoolId) return;

    this.logger.log(`Broadcasting dashboard update for school ${schoolId} due to ${eventType}`);

    // Map events to dashboard refresh events
    let dashboardEvent = 'dashboard:refresh';

    switch (eventType) {
      case 'ADMISSION_CONFIRMED':
      case 'APPLICATION_SUBMITTED':
        dashboardEvent = 'dashboard:admissions:refresh';
        break;
      case 'PAYMENT_RECEIVED':
      case 'INVOICE_GENERATED':
        dashboardEvent = 'dashboard:finance:refresh';
        break;
      case 'ATTENDANCE_MARKED':
        dashboardEvent = 'dashboard:attendance:refresh';
        break;
      case 'RESULT_PUBLISHED':
        dashboardEvent = 'dashboard:academic:refresh';
        break;
    }

    this.gateway.broadcastToSchool(schoolId, dashboardEvent, {
        eventType,
        timestamp: new Date(),
        message: `Dashboard data updated due to ${eventType.toLowerCase().replace('_', ' ')}`
    });

    // Also send a general refresh
    this.gateway.broadcastToSchool(schoolId, 'dashboard:refresh', { eventType });
  }
}
