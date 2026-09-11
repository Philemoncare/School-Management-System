import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CommunicationService } from '../../../communication/communication.service';

@Injectable()
export class StudentLifecycleHandler implements EventHandler {
  private readonly logger = new Logger(StudentLifecycleHandler.name);

  constructor(
    private prisma: PrismaService,
    private comms: CommunicationService,
  ) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { schoolId, eventType, payload } = event as any;
    const { studentId, newStatus } = payload;

    this.logger.log(`Handling ${eventType} for student ${studentId}`);

    if (['STUDENT_WITHDRAWN', 'STUDENT_GRADUATED', 'STUDENT_TRANSFERRED'].includes(eventType)) {
      await this.handleAccessRevocation(schoolId, studentId);
      await this.handleResourceCleanup(schoolId, studentId);
    }

    await this.handleNotification(schoolId, studentId, newStatus);
  }

  private async handleAccessRevocation(schoolId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (student?.userId) {
      // Logic to disable user account or school membership
      await this.prisma.schoolMembership.update({
        where: { schoolId_userId: { schoolId, userId: student.userId } },
        data: { status: 'INACTIVE' }
      });
    }
  }

  private async handleResourceCleanup(schoolId: string, studentId: string) {
    // End active transport assignments
    await this.prisma.transportAssignment.updateMany({
      where: { studentId, status: 'ACTIVE' },
      data: { status: 'CANCELLED', endDate: new Date() }
    });

    // Handle library loans (send reminder if outstanding)
    const loans = await this.prisma.libraryLoan.findMany({
      where: { membership: { userId: (await this.prisma.student.findUnique({ where: { id: studentId } }))?.userId || '' }, status: 'ACTIVE' }
    });
    // Notification logic for loans...
  }

  private async handleNotification(schoolId: string, studentId: string, status: string) {
    // Notify guardians...
  }
}
