import { Injectable, Logger } from '@nestjs/common';
import { OutboxEvent } from '@prisma/client';
import { EventHandler } from '../../workflow/events/event-dispatcher.service';
import { IndexingService } from '../indexing.service';

@Injectable()
export class SearchEventHandler implements EventHandler {
  private readonly logger = new Logger(SearchEventHandler.name);

  constructor(private indexingService: IndexingService) {}

  async handle(event: OutboxEvent) {
    const resourceId = (event.metadata as any)?.resourceId || (event.payload as any)?.id || (event.payload as any)?.studentId || (event.payload as any)?.teacherId || (event.payload as any)?.staffId || (event.payload as any)?.invoiceId || (event.payload as any)?.applicationId || (event.payload as any)?.paymentId || (event.payload as any)?.bookId || (event.payload as any)?.routeId || (event.payload as any)?.conversationId;

    if (!resourceId) return;

    this.logger.debug(`Processing search index update for ${event.eventType} on ${resourceId}`);

    try {
      switch (event.eventType) {
        // Students & Guardians
        case 'ADMISSION_CONFIRMED':
        case 'STUDENT_CREATED':
        case 'STUDENT_UPDATED':
        case 'STUDENT_PROMOTED':
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
        case 'INVOICE_CREATED':
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
        case 'LOAN_UPDATED':
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
        case 'ANNOUNCEMENT_UPDATED':
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
      this.logger.error(`Failed to index ${resourceId} for event ${event.eventType}: ${error.message}`);
    }
  }
}
