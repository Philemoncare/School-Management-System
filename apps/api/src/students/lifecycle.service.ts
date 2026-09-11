import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';
import { StudentStatus } from '@prisma/client';

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
  ) {}

  async updateStatus(schoolId: string, studentId: string, newStatus: StudentStatus, reason?: string, actorId?: string) {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, schoolId } });
    if (!student) throw new BadRequestException('Student not found');

    // Validate transition
    if (student.status === newStatus) return student;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id: studentId },
        data: { status: newStatus }
      });

      await this.audit.log({
        userId: actorId || 'SYSTEM',
        schoolId,
        action: `STUDENT_STATUS_${newStatus}`,
        module: 'STUDENTS',
        resourceId: studentId,
        metadata: { from: student.status, to: newStatus, reason }
      });

      await this.outbox.dispatch(
        new DomainEvent(
          `STUDENT_${newStatus}`,
          'STUDENT',
          studentId,
          { studentId, oldStatus: student.status, newStatus, reason },
          schoolId,
          actorId
        ),
        tx
      );

      return updated;
    });
  }
}
