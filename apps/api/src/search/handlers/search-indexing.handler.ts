import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../../workflow/events/event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { IndexingService } from '../indexing.service';

@Injectable()
export class SearchIndexingHandler implements EventHandler {
  private readonly logger = new Logger(SearchIndexingHandler.name);

  constructor(private indexingService: IndexingService) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { eventType, payload } = event;
    const data = payload as any;
    const resourceId = data.id || data.studentId || data.teacherId || data.staffId || data.invoiceId || data.applicationId || data.paymentId || data.bookId || data.routeId || data.conversationId;

    if (!resourceId) return;

    this.logger.debug(`Processing search index update for ${eventType} on ${resourceId}`);

    try {
      switch (eventType) {
        // Students & Guardians
        case 'STUDENT_CREATED':
        case 'STUDENT_UPDATED':
          await this.indexingService.indexStudent(resourceId);
          break;
        case 'GUARDIAN_CREATED':
        case 'GUARDIAN_UPDATED':
          await this.indexingService.indexGuardian(resourceId);
          break;

        // HR
        case 'TEACHER_CREATED':
        case 'TEACHER_UPDATED':
          await this.indexingService.indexTeacher(resourceId);
          break;
        case 'STAFF_CREATED':
        case 'STAFF_UPDATED':
          await this.indexingService.indexStaff(resourceId);
          break;

        // Academics
        case 'CLASS_CREATED':
        case 'CLASS_UPDATED':
          await this.indexingService.indexClass(resourceId);
          break;
        case 'SUBJECT_CREATED':
        case 'SUBJECT_UPDATED':
          await this.indexingService.indexSubject(resourceId);
          break;
        case 'ASSESSMENT_CREATED':
        case 'ASSESSMENT_UPDATED':
          await this.indexingService.indexAssessment(resourceId);
          break;
        case 'EXAM_PERIOD_CREATED':
        case 'EXAM_PERIOD_UPDATED':
          await this.indexingService.indexExamination(resourceId);
          break;
        case 'RESULT_PUBLISHED':
          await this.indexingService.indexResult(resourceId);
          break;

        // Finance
        case 'INVOICE_GENERATED':
        case 'INVOICE_UPDATED':
          await this.indexingService.indexInvoice(resourceId);
          break;
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_VERIFIED':
          await this.indexingService.indexPayment(resourceId);
          break;

        // Admissions
        case 'APPLICATION_SUBMITTED':
        case 'APPLICATION_STATUS_UPDATED':
          await this.indexingService.indexAdmissionApplication(resourceId);
          break;

        // Library
        case 'BOOK_CREATED':
        case 'BOOK_UPDATED':
          await this.indexingService.indexBook(resourceId);
          break;
        case 'LOAN_CREATED':
        case 'LOAN_RETURNED':
          await this.indexingService.indexLibraryLoan(resourceId);
          break;

        // Transport
        case 'ROUTE_CREATED':
        case 'ROUTE_UPDATED':
          await this.indexingService.indexTransportRoute(resourceId);
          break;
        case 'VEHICLE_CREATED':
        case 'VEHICLE_UPDATED':
          await this.indexingService.indexVehicle(resourceId);
          break;

        // Communication
        case 'ANNOUNCEMENT_PUBLISHED':
          await this.indexingService.indexAnnouncement(resourceId);
          break;
        case 'CONVERSATION_STARTED':
          await this.indexingService.indexConversation(resourceId);
          break;

        // Workflow
        case 'WORKFLOW_STARTED':
        case 'WORKFLOW_COMPLETED':
          await this.indexingService.indexWorkflow(resourceId);
          break;

        // Platform
        case 'SCHOOL_CREATED':
        case 'SCHOOL_UPDATED':
          await this.indexingService.indexSchool(resourceId);
          break;
        case 'USER_CREATED':
        case 'USER_UPDATED':
          await this.indexingService.indexUser(resourceId);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to index ${resourceId} for event ${eventType}: ${error.message}`);
    }
  }
}
