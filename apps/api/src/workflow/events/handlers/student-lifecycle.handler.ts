import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CommunicationService } from '../../../communication/communication.service';
import { NotificationsService } from '../../../notifications/notifications.service';

@Injectable()
export class StudentLifecycleHandler implements EventHandler {
  private readonly logger = new Logger(StudentLifecycleHandler.name);

  constructor(
    private prisma: PrismaService,
    private comms: CommunicationService,
    private notifications: NotificationsService,
  ) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { schoolId, eventType, payload } = event as any;
    const { studentId, newStatus } = payload;

    this.logger.log(`Handling ${eventType} for student ${studentId}`);

    if (['STUDENT_WITHDRAWN', 'STUDENT_GRADUATED', 'STUDENT_TRANSFERRED'].includes(eventType)) {
      await this.handleAccessRevocation(schoolId, studentId);
      await this.handleResourceCleanup(schoolId, studentId);
    }

    await this.handleNotification(schoolId, studentId, newStatus, eventType);
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
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    const loans = await this.prisma.libraryLoan.findMany({
      where: { membership: { userId: student?.userId || '' }, status: 'ACTIVE' }
    });
    // Notification logic for loans...
  }

  private async handleNotification(schoolId: string, studentId: string, status: string, eventType: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { guardians: { include: { guardian: true } } },
    });
    if (!student) return;

    const titleMap: Record<string, string> = {
      STUDENT_WITHDRAWN: 'Student Withdrawn',
      STUDENT_GRADUATED: 'Student Graduated',
      STUDENT_TRANSFERRED: 'Student Transferred',
    };

    const title = titleMap[eventType] || 'Student Status Changed';
    const content = `${student.firstName} ${student.lastName} (${student.studentNumber}) status changed to ${status || 'updated'}.`;

    // Notify guardians linked to the student.
    for (const link of student.guardians || []) {
      const guardian = link.guardian;
      if (guardian?.userId) {
        await this.notifications.send(
          guardian.userId,
          title,
          content,
          'STUDENT_STATUS_CHANGE',
          schoolId,
        );
      }
    }

    // Notify school administrators.
    const admins = await this.prisma.schoolMembership.findMany({
      where: { schoolId, status: 'ACTIVE' },
      include: { user: true },
    });
    for (const membership of admins) {
      if (membership.user?.isActive) {
        await this.notifications.send(
          membership.user.id,
          title,
          content,
          'STUDENT_STATUS_CHANGE',
          schoolId,
        );
      }
    }
  }
}
