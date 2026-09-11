import { Module, OnModuleInit } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { IndexingService } from './indexing.service';
import { SearchEventHandler } from './handlers/search-event.handler';
import { AuditModule } from '../audit/audit.module';
import { EventDispatcherService } from '../workflow/events/event-dispatcher.service';

@Module({
  imports: [AuditModule],
  controllers: [SearchController],
  providers: [SearchService, IndexingService, SearchEventHandler],
  exports: [SearchService, IndexingService],
})
export class SearchModule implements OnModuleInit {
  constructor(
    private eventDispatcher: EventDispatcherService,
  ) {}

  onModuleInit() {
    // Register for relevant events (Objective 38)
    const events = [
      'ADMISSION_CONFIRMED',
      'STUDENT_CREATED',
      'STUDENT_UPDATED',
      'STUDENT_PROMOTED',
      'GUARDIAN_CREATED',
      'GUARDIAN_UPDATED',
      'TEACHER_CREATED',
      'TEACHER_UPDATED',
      'STAFF_CREATED',
      'STAFF_UPDATED',
      'CLASS_CREATED',
      'CLASS_UPDATED',
      'SUBJECT_CREATED',
      'SUBJECT_UPDATED',
      'ASSESSMENT_CREATED',
      'ASSESSMENT_UPDATED',
      'EXAM_PERIOD_CREATED',
      'EXAM_PERIOD_UPDATED',
      'RESULT_PUBLISHED',
      'INVOICE_CREATED',
      'INVOICE_GENERATED',
      'INVOICE_UPDATED',
      'PAYMENT_RECEIVED',
      'PAYMENT_VERIFIED',
      'APPLICATION_SUBMITTED',
      'APPLICATION_STATUS_UPDATED',
      'BOOK_CREATED',
      'BOOK_UPDATED',
      'LOAN_CREATED',
      'LOAN_UPDATED',
      'LOAN_RETURNED',
      'ROUTE_CREATED',
      'ROUTE_UPDATED',
      'VEHICLE_CREATED',
      'VEHICLE_UPDATED',
      'ANNOUNCEMENT_PUBLISHED',
      'ANNOUNCEMENT_UPDATED',
      'CONVERSATION_STARTED',
      'WORKFLOW_STARTED',
      'WORKFLOW_COMPLETED',
      'SCHOOL_CREATED',
      'SCHOOL_UPDATED',
      'USER_CREATED',
      'USER_UPDATED',
    ];

    for (const event of events) {
      this.eventDispatcher.register(event, SearchEventHandler);
    }
  }
}
