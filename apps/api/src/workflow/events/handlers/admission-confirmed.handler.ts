import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { BillingService } from '../../../finance/billing.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowService } from '../../workflow.service';
import { CommunicationService } from '../../../communication/communication.service';

@Injectable()
export class AdmissionConfirmedHandler implements EventHandler {
  private readonly logger = new Logger(AdmissionConfirmedHandler.name);

  constructor(
    private billingService: BillingService,
    private prisma: PrismaService,
    private workflowService: WorkflowService,
    private comms: CommunicationService,
  ) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { schoolId, payload, metadata } = event as any;
    const { studentId, applicationId, academicYearId, classId } = payload;
    const actorId = metadata?.actorUserId;

    this.logger.log(`Handling ADMISSION_CONFIRMED for student ${studentId} in school ${schoolId}`);

    // Start a workflow to track this process
    const workflow = await this.workflowService.startWorkflow(
      schoolId,
      'ADMISSION_INTEGRATION',
      ['BILLING', 'PORTAL_INVITATION', 'NOTIFICATION'],
      payload,
      metadata?.correlationId
    );

    try {
      // 1. BILLING
      await this.workflowService.updateStep(workflow.id, 'BILLING', 'IN_PROGRESS');
      await this.handleBilling(schoolId, studentId, academicYearId, classId, actorId);
      await this.workflowService.updateStep(workflow.id, 'BILLING', 'COMPLETED');

      // 2. PORTAL_INVITATION
      await this.workflowService.updateStep(workflow.id, 'PORTAL_INVITATION', 'IN_PROGRESS');
      // In a real app, we'd check if student has a userId, if not, create or invite
      await this.handlePortalInvitation(schoolId, studentId);
      await this.workflowService.updateStep(workflow.id, 'PORTAL_INVITATION', 'COMPLETED');

      // 3. NOTIFICATION
      await this.workflowService.updateStep(workflow.id, 'NOTIFICATION', 'IN_PROGRESS');
      await this.handleNotification(schoolId, studentId);
      await this.workflowService.updateStep(workflow.id, 'NOTIFICATION', 'COMPLETED');

      await this.workflowService.completeWorkflow(workflow.id);
    } catch (error) {
      this.logger.error(`Admission integration workflow ${workflow.id} failed: ${error.message}`);
      await this.workflowService.failWorkflow(workflow.id, error.message);
      // We don't throw here because the workflow state tracks it,
      // but BullMQ might want to retry if it's a transient error.
      throw error;
    }
  }

  private async handleBilling(schoolId: string, studentId: string, academicYearId: string, classId: string, actorId: string) {
    // Find mandatory fee structures for this class
    const fees = await this.prisma.feeStructure.findMany({
      where: {
        schoolId,
        academicYearId,
        classId,
        isMandatory: true,
        status: 'ACTIVE'
      }
    });

    if (fees.length > 0) {
      await this.billingService.createIndividualInvoice(schoolId, {
        studentId,
        academicYearId,
        feeStructureIds: fees.map(f => f.id),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }, actorId || 'SYSTEM');
    }
  }

  private async handlePortalInvitation(schoolId: string, studentId: string) {
    // Logic to invite student to portal
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (student?.userId) {
      // User already exists, maybe notify them about the new school membership/student profile
    } else {
      // Logic to create a User account or send an invitation link
    }
  }

  private async handleNotification(schoolId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: { guardians: { include: { guardian: true } } }
    });

    // Notify primary guardian
    const primaryGuardian = student?.guardians.find(g => g.isPrimary)?.guardian;
    if (primaryGuardian?.userId || primaryGuardian?.email) {
      await this.comms.sendNotification({
        schoolId,
        userId: primaryGuardian.userId || '',
        type: 'ADMISSION_WELCOME',
        data: {
          studentName: `${student?.firstName} ${student?.lastName}`,
          schoolName: 'Our School', // Should fetch school name
        }
      });
    }
  }
}
