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

    if (fromAcademicYearId === toAcademicYearId) {
      throw new BadRequestException('The destination academic year must be different.');
    }

    const [student, fromYear, toYear, toClass] = await Promise.all([
      this.prisma.student.findFirst({ where: { id: studentId, schoolId }, select: { id: true } }),
      this.prisma.academicYear.findFirst({
        where: { id: fromAcademicYearId, schoolId },
        select: { id: true },
      }),
      this.prisma.academicYear.findFirst({
        where: { id: toAcademicYearId, schoolId },
        select: { id: true },
      }),
      this.prisma.class.findFirst({
        where: { id: toClassId, schoolId },
        select: { id: true },
      }),
    ]);

    if (!student) throw new NotFoundException('Student not found in this school');
    if (!fromYear) throw new NotFoundException('Current academic year not found');
    if (!toYear) throw new NotFoundException('Destination academic year not found');
    if (!toClass) throw new NotFoundException('Destination class not found');

    if (toSectionId) {
      const section = await this.prisma.section.findFirst({
        where: { id: toSectionId, classId: toClassId },
        select: { id: true },
      });
      if (!section) throw new NotFoundException('Destination section does not belong to the class');
    }

    const currentEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        schoolId,
        academicYearId: fromAcademicYearId,
        status: EnrollmentStatus.ACTIVE,
      },
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
