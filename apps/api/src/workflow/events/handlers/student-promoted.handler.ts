import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { BillingService } from '../../../finance/billing.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowService } from '../../workflow.service';
import { CommunicationService } from '../../../communication/communication.service';

@Injectable()
export class StudentPromotedHandler implements EventHandler {
  private readonly logger = new Logger(StudentPromotedHandler.name);

  constructor(
    private billingService: BillingService,
    private prisma: PrismaService,
    private workflowService: WorkflowService,
    private comms: CommunicationService,
  ) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { schoolId, payload, metadata } = event as any;
    const { studentId, newEnrollmentId, academicYearId, classId } = payload;
    const actorId = metadata?.actorUserId;

    this.logger.log(`Handling STUDENT_PROMOTED for student ${studentId} in school ${schoolId}`);

    const workflow = await this.workflowService.startWorkflow(
      schoolId,
      'STUDENT_PROMOTION',
      ['BILLING', 'NOTIFICATION'],
      payload,
      metadata?.correlationId
    );

    try {
      // 1. BILLING for new year
      await this.workflowService.updateStep(workflow.id, 'BILLING', 'IN_PROGRESS');
      await this.handleBilling(schoolId, studentId, academicYearId, classId, actorId);
      await this.workflowService.updateStep(workflow.id, 'BILLING', 'COMPLETED');

      // 2. NOTIFICATION
      await this.workflowService.updateStep(workflow.id, 'NOTIFICATION', 'IN_PROGRESS');
      await this.handleNotification(schoolId, studentId, classId);
      await this.workflowService.updateStep(workflow.id, 'NOTIFICATION', 'COMPLETED');

      await this.workflowService.completeWorkflow(workflow.id);
    } catch (error) {
      this.logger.error(`Promotion workflow ${workflow.id} failed: ${error.message}`);
      await this.workflowService.failWorkflow(workflow.id, error.message);
      throw error;
    }
  }

  private async handleBilling(schoolId: string, studentId: string, academicYearId: string, classId: string, actorId: string) {
    const fees = await this.prisma.feeStructure.findMany({
      where: { schoolId, academicYearId, classId, isMandatory: true, status: 'ACTIVE' }
    });

    if (fees.length > 0) {
      await this.billingService.createIndividualInvoice(schoolId, {
        studentId,
        academicYearId,
        feeStructureIds: fees.map(f => f.id),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }, actorId || 'SYSTEM');
    }
  }

  private async handleNotification(schoolId: string, studentId: string, classId: string) {
    const [student, clazz] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: studentId }, include: { user: true } }),
      this.prisma.class.findUnique({ where: { id: classId } })
    ]);

    if (student?.userId) {
      await this.comms.sendNotification({
        schoolId,
        userId: student.userId,
        type: 'STUDENT_PROMOTED',
        data: {
          studentName: `${student.firstName} ${student.lastName}`,
          className: clazz?.name || 'next level',
        }
      });
    }
  }
}
