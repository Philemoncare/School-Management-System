import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { WorkflowService } from '../../workflow.service';
import { CommunicationService } from '../../../communication/communication.service';

@Injectable()
export class TeacherCreatedHandler implements EventHandler {
  private readonly logger = new Logger(TeacherCreatedHandler.name);

  constructor(
    private prisma: PrismaService,
    private workflowService: WorkflowService,
    private comms: CommunicationService,
  ) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { schoolId, payload, metadata } = event as any;
    const { teacherId, employeeId } = payload;
    const actorId = metadata?.actorUserId;

    this.logger.log(`Handling TEACHER_CREATED for teacher ${teacherId} in school ${schoolId}`);

    const workflow = await this.workflowService.startWorkflow(
      schoolId,
      'TEACHER_ONBOARDING',
      ['ACCOUNT_SETUP', 'NOTIFICATION'],
      payload,
      metadata?.correlationId
    );

    try {
      // 1. ACCOUNT_SETUP
      await this.workflowService.updateStep(workflow.id, 'ACCOUNT_SETUP', 'IN_PROGRESS');
      await this.handleAccountSetup(schoolId, teacherId);
      await this.workflowService.updateStep(workflow.id, 'ACCOUNT_SETUP', 'COMPLETED');

      // 2. NOTIFICATION
      await this.workflowService.updateStep(workflow.id, 'NOTIFICATION', 'IN_PROGRESS');
      await this.handleNotification(schoolId, teacherId);
      await this.workflowService.updateStep(workflow.id, 'NOTIFICATION', 'COMPLETED');

      await this.workflowService.completeWorkflow(workflow.id);
    } catch (error) {
      this.logger.error(`Teacher onboarding workflow ${workflow.id} failed: ${error.message}`);
      await this.workflowService.failWorkflow(workflow.id, error.message);
      throw error;
    }
  }

  private async handleAccountSetup(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true }
    });

    if (teacher?.userId) {
      // Ensure teacher role in UserRole
      const teacherRole = await this.prisma.role.findFirst({
        where: { name: 'TEACHER', schoolId: null } // System role
      });

      if (teacherRole) {
        await this.prisma.userRole.upsert({
          where: {
            userId_roleId_schoolId: {
              userId: teacher.userId,
              roleId: teacherRole.id,
              schoolId,
            }
          },
          update: {},
          create: {
            userId: teacher.userId,
            roleId: teacherRole.id,
            schoolId,
          }
        });
      }
    }
  }

  private async handleNotification(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        include: { user: true }
    });

    if (teacher?.user?.email) {
      await this.comms.sendNotification({
        schoolId,
        userId: teacher.userId || '',
        type: 'STAFF_WELCOME',
        data: {
          staffName: `${teacher.firstName} ${teacher.lastName}`,
          employeeId: teacher.employeeId || '',
        }
      });
    }
  }
}
