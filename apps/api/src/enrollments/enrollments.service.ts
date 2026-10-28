import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEnrollmentDto, MoveStudentDto } from './dto/enrollment.dto';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async enroll(schoolId: string, dto: CreateEnrollmentDto, actorId: string) {
    // Basic verification
    const student = await this.prisma.student.findFirst({ where: { id: dto.studentId, schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    const year = await this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } });
    if (!year) throw new NotFoundException('Academic year not found');

    const clazz = await this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } });
    if (!clazz) throw new NotFoundException('Class not found');

    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, classId: dto.classId } });
      if (!section) throw new NotFoundException('Section not found in this class');
    }

    // Check for existing active enrollment in the same year/term
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        termId: dto.termId || null,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    if (existing) throw new ConflictException('Student already has an active enrollment for this period');

    const enrollment = await this.prisma.enrollment.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'STUDENT_ENROLLED',
      module: 'ENROLLMENTS',
      resourceId: enrollment.id,
      metadata: dto,
    });

    return enrollment;
  }

  async findBySchool(schoolId: string) {
    return this.prisma.enrollment.findMany({
      where: { academicYear: { schoolId } },
      include: {
        student: true,
        academicYear: true,
        class: true,
        section: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStudentHistory(schoolId: string, studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId, student: { schoolId } },
      include: {
        academicYear: true,
        term: true,
        class: true,
        section: true,
      },
      orderBy: { academicYear: { startDate: 'desc' } },
    });
  }

  async move(schoolId: string, id: string, dto: MoveStudentDto, actorId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id, academicYear: { schoolId } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return this.prisma.$transaction(async (tx) => {
      // Deactivate current enrollment
      await tx.enrollment.update({
        where: { id },
        data: { status: EnrollmentStatus.TRANSFERRED },
      });

      // Create new enrollment
      const moved = await tx.enrollment.create({
        data: {
          schoolId: enrollment.schoolId,
          studentId: enrollment.studentId,
          academicYearId: enrollment.academicYearId,
          termId: enrollment.termId,
          classId: dto.newClassId,
          sectionId: dto.newSectionId,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'STUDENT_MOVED',
        module: 'ENROLLMENTS',
        resourceId: moved.id,
        metadata: { ...dto, oldEnrollmentId: id },
      });

      return moved;
    });
  }
}
