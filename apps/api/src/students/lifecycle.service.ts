import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';
import { EnrollmentStatus, StudentStatus } from '@prisma/client';

const LEAVING_STATUSES: StudentStatus[] = [
  StudentStatus.WITHDRAWN,
  StudentStatus.TRANSFERRED,
  StudentStatus.GRADUATED,
];

const ENROLLMENT_ON_LEAVE: Partial<Record<StudentStatus, EnrollmentStatus>> = {
  WITHDRAWN: EnrollmentStatus.WITHDRAWN,
  TRANSFERRED: EnrollmentStatus.TRANSFERRED,
  GRADUATED: EnrollmentStatus.COMPLETED,
};

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
  ) {}

  async updateStatus(
    schoolId: string,
    studentId: string,
    newStatus: StudentStatus,
    reason?: string,
    actorId?: string,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found in this school');

    if (student.status === newStatus) return student;

    if (LEAVING_STATUSES.includes(newStatus) && !reason?.trim()) {
      throw new BadRequestException(
        'A reason is required when withdrawing, transferring, or graduating a student.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.student.update({
        where: { id: studentId },
        data: { status: newStatus },
      });

      const enrollmentStatus = ENROLLMENT_ON_LEAVE[newStatus];
      if (enrollmentStatus) {
        await tx.enrollment.updateMany({
          where: { schoolId, studentId, status: EnrollmentStatus.ACTIVE },
          data: { status: enrollmentStatus },
        });
      }

      await this.audit.log(
        {
          userId: actorId || 'SYSTEM',
          schoolId,
          action: `STUDENT_STATUS_${newStatus}`,
          module: 'STUDENTS',
          resourceId: studentId,
          metadata: { from: student.status, to: newStatus, reason },
        },
        tx,
      );

      await this.outbox.dispatch(
        new DomainEvent(
          `STUDENT_${newStatus}`,
          'STUDENT',
          studentId,
          { studentId, oldStatus: student.status, newStatus, reason },
          schoolId,
          actorId,
        ),
        tx,
      );

      return updated;
    });
  }
}
