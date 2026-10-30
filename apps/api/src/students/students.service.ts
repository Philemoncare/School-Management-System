import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommunicationGateway } from '../communication/gateways/communication.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { EnrollmentStatus, Prisma, StudentStatus } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';

const STUDENT_ENROLLMENT_INCLUDE = {
  class: true,
  section: true,
  academicYear: true,
  term: true,
} satisfies Prisma.EnrollmentInclude;

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private gateway: CommunicationGateway,
    private settings: SettingsService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Registers a student and, when a class is supplied, their first enrollment
   * in the same transaction so a half-registered student can never exist.
   */
  async create(schoolId: string, dto: CreateStudentDto, actorId: string) {
    const { academicYearId, termId, classId, sectionId, ...studentFields } = dto;
    const wantsEnrollment = Boolean(
      academicYearId || termId || classId || sectionId,
    );

    if (wantsEnrollment && (!academicYearId || !classId)) {
      throw new BadRequestException(
        'An academic year and class are required to enroll the student.',
      );
    }

    if (termId && !academicYearId) {
      throw new BadRequestException('An academic year is required with a term.');
    }

    const studentNumber =
      studentFields.studentNumber ||
      (await this.settings.generateNextNumber(schoolId, 'STUDENT'));

    const duplicate = await this.prisma.student.findFirst({
      where: {
        schoolId,
        OR: [
          { studentNumber },
          ...(studentFields.admissionNumber
            ? [{ admissionNumber: studentFields.admissionNumber }]
            : []),
        ],
      },
      select: { id: true, studentNumber: true, admissionNumber: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'A student with this student number or admission number already exists in this school.',
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      if (wantsEnrollment) {
        const [year, clazz] = await Promise.all([
          tx.academicYear.findFirst({
            where: { id: academicYearId, schoolId },
            select: { id: true },
          }),
          tx.class.findFirst({
            where: { id: classId, schoolId },
            select: { id: true },
          }),
        ]);
        if (!year) throw new NotFoundException('Academic year not found in this school');
        if (!clazz) throw new NotFoundException('Class not found in this school');

        if (termId) {
          const term = await tx.term.findFirst({
            where: { id: termId, academicYearId },
            select: { id: true },
          });
          if (!term) throw new NotFoundException('Term does not belong to the selected academic year');
        }

        if (sectionId) {
          const section = await tx.section.findFirst({
            where: { id: sectionId, classId },
            select: { id: true },
          });
          if (!section) throw new NotFoundException('Section does not belong to the selected class');
        }
      }

      const student = await tx.student.create({
        data: {
          ...studentFields,
          studentNumber,
          status: studentFields.status ?? StudentStatus.ACTIVE,
          schoolId,
          ...(studentFields.userId ? { userId: studentFields.userId } : {}),
        },
      });

      let enrollment = null;
      if (wantsEnrollment) {
        enrollment = await tx.enrollment.create({
          data: {
            schoolId,
            studentId: student.id,
            academicYearId: academicYearId as string,
            termId: termId ?? null,
            classId: classId as string,
            sectionId: sectionId ?? null,
            status: EnrollmentStatus.ACTIVE,
          },
          include: STUDENT_ENROLLMENT_INCLUDE,
        });
      }

      return { student, enrollment };
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'STUDENT_CREATED',
      module: 'STUDENTS',
      resourceId: created.student.id,
      metadata: {
        studentNumber: created.student.studentNumber,
        enrollmentId: created.enrollment?.id,
      },
    });

    // Notify school administrators of the new student registration.
    await this.notifications.send(
      actorId,
      'New student registered',
      `${created.student.firstName} ${created.student.lastName} (${created.student.studentNumber}) has been registered${created.enrollment ? ` and enrolled in ${created.enrollment.class?.name || 'a class'}` : ''}.`,
      'STUDENT_REGISTRATION',
      schoolId,
    );

    this.gateway.broadcastToSchool(schoolId, 'STUDENT_CREATED', created.student);

    return { ...created.student, enrollment: created.enrollment };
  }

  async findAll(schoolId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {
      schoolId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { middleName: { contains: search, mode: 'insensitive' } },
              { studentNumber: { contains: search, mode: 'insensitive' } },
              { admissionNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          user: { select: { id: true, email: true, isActive: true } },
          guardians: { include: { guardian: true } },
          enrollments: {
            where: { status: EnrollmentStatus.ACTIVE },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: STUDENT_ENROLLMENT_INCLUDE,
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      items: items.map(({ enrollments, ...student }) => ({
        ...student,
        currentEnrollment: enrollments[0] ?? null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(schoolId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            isActive: true,
            emailVerified: true,
          },
        },
        guardians: { include: { guardian: true } },
        enrollments: {
          orderBy: { createdAt: 'desc' },
          include: STUDENT_ENROLLMENT_INCLUDE,
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  /**
   * Everything the student profile screen needs, from real records:
   * placement, finance position, attendance and published results.
   */
  async getOverview(schoolId: string, id: string) {
    const student = await this.findOne(schoolId, id);
    const currentEnrollment = student.enrollments.find((e) => e.status === EnrollmentStatus.ACTIVE) ?? null;
    const enrollmentFilter = currentEnrollment ? { enrollmentId: currentEnrollment.id } : {};

    const [invoices, payments, attendanceGroups, overallResults, subjectResults, reportCards] =
      await Promise.all([
        this.prisma.invoice.findMany({
          where: { schoolId, studentId: id, status: { notIn: ['VOID', 'CANCELLED'] } },
          orderBy: { issueDate: 'desc' },
          include: { items: true },
        }),
        this.prisma.payment.findMany({
          where: { schoolId, studentId: id },
          orderBy: { paymentDate: 'desc' },
        }),
        this.prisma.studentAttendance.groupBy({
          by: ['status'],
          where: { schoolId, studentId: id, ...enrollmentFilter },
          _count: { _all: true },
        }),
        this.prisma.overallResult.findMany({
          where: { schoolId, studentId: id },
          orderBy: { calculatedAt: 'desc' },
          take: 6,
          include: { term: true, class: true, section: true },
        }),
        this.prisma.subjectResult.findMany({
          where: {
            schoolId,
            studentId: id,
            ...(currentEnrollment
              ? {
                  academicYearId: currentEnrollment.academicYearId,
                  termId: currentEnrollment.termId,
                }
              : {}),
          },
          orderBy: { percentage: 'desc' },
          include: { subject: true },
        }),
        this.prisma.reportCard.findMany({
          where: { schoolId, studentId: id },
          orderBy: { createdAt: 'desc' },
          include: { term: true, class: true },
        }),
      ]);

    const invoiceTotal = invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);
    const invoicePaid = invoices.reduce((sum, i) => sum + Number(i.amountPaid), 0);
    const invoiceBalance = invoices.reduce((sum, i) => sum + Number(i.balance), 0);

    const attendance = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    for (const group of attendanceGroups) {
      const count = group._count._all;
      attendance.total += count;
      if (group.status === 'PRESENT') attendance.present += count;
      else if (group.status === 'ABSENT') attendance.absent += count;
      else if (group.status === 'LATE') attendance.late += count;
      else if (group.status === 'EXCUSED') attendance.excused += count;
    }

    return {
      student,
      currentEnrollment,
      finance: {
        currency: invoices[0]?.currency ?? null,
        invoiceTotal,
        invoicePaid,
        invoiceBalance,
        invoiceCount: invoices.length,
        invoices: invoices.slice(0, 10),
        payments: payments.slice(0, 10),
        lastPaymentAt: payments[0]?.paymentDate ?? null,
      },
      attendance: {
        ...attendance,
        rate:
          attendance.total === 0
            ? null
            : Math.round(((attendance.present + attendance.late) / attendance.total) * 1000) / 10,
      },
      results: {
        overall: overallResults,
        subjects: subjectResults,
        reportCards,
      },
    };
  }

  async update(schoolId: string, id: string, dto: UpdateStudentDto, actorId: string) {
    const student = await this.findOne(schoolId, id);

    if (dto.admissionNumber && dto.admissionNumber !== student.admissionNumber) {
      const duplicate = await this.prisma.student.findFirst({
        where: {
          schoolId,
          admissionNumber: dto.admissionNumber,
          NOT: { id },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('This admission number is already used in this school.');
      }
    }

    if (dto.userId && dto.userId !== student.userId) {
      const linked = await this.prisma.student.findFirst({
        where: { userId: dto.userId, NOT: { id } },
        select: { id: true },
      });
      if (linked) {
        throw new ConflictException('This user account is already linked to another student.');
      }
    }

    const updated = await this.prisma.student.update({
      where: { id: student.id },
      data: {
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        admissionNumber: dto.admissionNumber,
        admissionDate: dto.admissionDate,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        status: dto.status,
        userId: dto.userId,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'STUDENT_UPDATED',
      module: 'STUDENTS',
      resourceId: id,
      metadata: dto as Record<string, unknown>,
    });

    this.gateway.broadcastToSchool(schoolId, 'STUDENT_UPDATED', updated);

    return updated;
  }
}
