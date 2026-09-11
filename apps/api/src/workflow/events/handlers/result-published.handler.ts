import { Injectable, Logger } from '@nestjs/common';
import { EventHandler } from '../event-dispatcher.service';
import { OutboxEvent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CommunicationService } from '../../../communication/communication.service';

@Injectable()
export class ResultPublishedHandler implements EventHandler {
  private readonly logger = new Logger(ResultPublishedHandler.name);

  constructor(
    private prisma: PrismaService,
    private comms: CommunicationService,
  ) {}

  async handle(event: OutboxEvent): Promise<void> {
    const { schoolId, payload } = event as any;
    const { classId, academicYearId, termId } = payload;

    this.logger.log(`Handling RESULT_PUBLISHED for class ${classId}`);

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId, academicYearId, termId, status: 'ACTIVE' },
      include: { student: { include: { user: true, guardians: { include: { guardian: true } } } } }
    });

    for (const enrollment of enrollments) {
        // Notify Student
        if (enrollment.student.userId) {
            await this.comms.sendNotification({
                schoolId,
                userId: enrollment.student.userId,
                type: 'RESULT_PUBLISHED',
                data: {
                    studentName: enrollment.student.firstName,
                    termName: 'Current Term', // Should fetch actual term name
                }
            });
        }

        // Notify Primary Guardian
        const primaryGuardian = enrollment.student.guardians.find(g => g.isPrimary)?.guardian;
        if (primaryGuardian?.userId) {
             await this.comms.sendNotification({
                schoolId,
                userId: primaryGuardian.userId,
                type: 'RESULT_PUBLISHED',
                data: {
                    studentName: enrollment.student.firstName,
                    termName: 'Current Term',
                }
            });
        }
    }
  }
}
