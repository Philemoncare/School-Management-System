import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class PromotionService {
  private readonly logger = new Logger(PromotionService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
  ) {}

  async promoteStudent(schoolId: string, params: {
    studentId: string;
    fromAcademicYearId: string;
    toAcademicYearId: string;
    toClassId: string;
    toSectionId?: string;
  }, actorId: string) {
    const { studentId, fromAcademicYearId, toAcademicYearId, toClassId, toSectionId } = params;

    const currentEnrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, academicYearId: fromAcademicYearId, status: EnrollmentStatus.ACTIVE }
    });

    if (!currentEnrollment) throw new NotFoundException('Active enrollment for current year not found');

    return this.prisma.$transaction(async (tx) => {
      // 1. Close current enrollment
      await tx.enrollment.update({
        where: { id: currentEnrollment.id },
        data: { status: EnrollmentStatus.PROMOTED }
      });

      // 2. Create new enrollment
      const newEnrollment = await tx.enrollment.create({
        data: {
          schoolId,
          studentId,
          academicYearId: toAcademicYearId,
          classId: toClassId,
          sectionId: toSectionId,
          status: EnrollmentStatus.ACTIVE
        }
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'STUDENT_PROMOTED',
        module: 'ACADEMICS',
        resourceId: studentId,
        metadata: { fromYear: fromAcademicYearId, toYear: toAcademicYearId, toClass: toClassId }
      });

      // 3. Dispatch promotion event
      await this.outbox.dispatch(
        new DomainEvent(
          'STUDENT_PROMOTED',
          'STUDENT',
          studentId,
          {
            studentId,
            oldEnrollmentId: currentEnrollment.id,
            newEnrollmentId: newEnrollment.id,
            academicYearId: toAcademicYearId,
            classId: toClassId
          },
          schoolId,
          actorId
        ),
        tx
      );

      return newEnrollment;
    });
  }
}
