import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommunicationService } from '../communication/communication.service';
import { CommunicationGateway } from '../communication/gateways/communication.gateway';
import { CreateAttendanceSessionDto, UpdateAttendanceSessionDto } from './dto/attendance-session.dto';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/student-attendance.dto';
import { AttendanceSessionStatus, AttendanceStatus, NotificationPriority } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private comms: CommunicationService,
    private gateway: CommunicationGateway,
  ) {}

  async createSession(schoolId: string, dto: CreateAttendanceSessionDto, actorId: string) {
    // Verify entities belong to the school
    const academicYear = await this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } });
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const clazz = await this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } });
    if (!clazz) throw new NotFoundException('Class not found');

    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, classId: dto.classId } });
      if (!section) throw new NotFoundException('Section not found in this class');
    }

    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } });
      if (!subject) throw new NotFoundException('Subject not found');
    }

    // Check for existing session
    const existing = await this.prisma.attendanceSession.findFirst({
      where: {
        schoolId,
        date: dto.date,
        classId: dto.classId,
        sectionId: dto.sectionId || null,
        subjectId: dto.subjectId || null,
        sessionType: dto.sessionType,
      },
    });

    if (existing) throw new ConflictException('Attendance session already exists for this period');

    const session = await this.prisma.attendanceSession.create({
      data: {
        ...dto,
        schoolId,
        createdBy: actorId,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ATTENDANCE_SESSION_CREATED',
      module: 'ATTENDANCE',
      resourceId: session.id,
      metadata: dto,
    });

    return session;
  }

  /**
   * Lists the students who can be marked for a class/section before a session
   * exists. The roll-call screen needs this to create the session on save.
   */
  async getEligibleStudentsForClass(
    schoolId: string,
    classId: string,
    sectionId?: string,
    academicYearId?: string,
  ) {
    if (!classId) throw new BadRequestException('classId is required');

    const clazz = await this.prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!clazz) throw new NotFoundException('Class not found');

    let yearId = academicYearId;
    if (!yearId) {
      const activeYear = await this.prisma.academicYear.findFirst({
        where: { schoolId, status: 'ACTIVE' },
        orderBy: { startDate: 'desc' },
      });
      yearId = activeYear?.id;
      if (!yearId) {
        const latestEnrollment = await this.prisma.enrollment.findFirst({
          where: { schoolId, classId, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        });
        yearId = latestEnrollment?.academicYearId;
      }
    }
    if (!yearId) {
      throw new BadRequestException(
        'No active academic year. Create and activate an academic year first.',
      );
    }

    return this.prisma.enrollment.findMany({
      where: {
        schoolId,
        academicYearId: yearId,
        classId,
        sectionId: sectionId || undefined,
        status: 'ACTIVE',
      },
      include: {
        student: true,
        section: true,
        class: true,
        academicYear: true,
      },
      orderBy: [{ student: { lastName: 'asc' } }, { student: { firstName: 'asc' } }],
    });
  }

  async getEligibleStudents(schoolId: string, sessionId: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id: sessionId, schoolId },
    });
    if (!session) throw new NotFoundException('Attendance session not found');

    // Find students enrolled in this class/section for this academic year
    return this.prisma.enrollment.findMany({
      where: {
        schoolId,
        academicYearId: session.academicYearId,
        classId: session.classId,
        sectionId: session.sectionId || undefined,
        status: 'ACTIVE',
      },
      include: {
        student: true,
      },
    });
  }

  async markAttendance(schoolId: string, sessionId: string, dto: MarkAttendanceDto, actorId: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id: sessionId, schoolId },
    });
    if (!session) throw new NotFoundException('Attendance session not found');

    if (session.status === AttendanceSessionStatus.LOCKED) {
      throw new ForbiddenException('Attendance session is locked');
    }

    // Verify enrollment
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: dto.studentId,
        academicYearId: session.academicYearId,
        schoolId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) throw new BadRequestException('Student not enrolled for this period');

    const attendance = await this.prisma.studentAttendance.upsert({
      where: {
        attendanceSessionId_studentId: {
          attendanceSessionId: sessionId,
          studentId: dto.studentId,
        },
      },
      update: {
        status: dto.status,
        checkInTime: dto.checkInTime,
        checkOutTime: dto.checkOutTime,
        minutesLate: dto.minutesLate,
        reason: dto.reason,
        remarks: dto.remarks,
        updatedBy: actorId,
      },
      create: {
        ...dto,
        schoolId,
        attendanceSessionId: sessionId,
        enrollmentId: enrollment.id,
        markedBy: actorId,
        markedAt: new Date(),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ATTENDANCE_MARKED',
      module: 'ATTENDANCE',
      resourceId: attendance.id,
      metadata: { studentId: dto.studentId, status: dto.status },
    });

    // --- Trigger Notifications ---
    if (dto.status === AttendanceStatus.ABSENT) {
      await this.triggerAbsenceNotification(schoolId, dto.studentId, session.date);
    }

    this.gateway.broadcastToSchool(schoolId, 'ATTENDANCE_UPDATED', attendance);

    return attendance;
  }

  private async triggerAbsenceNotification(schoolId: string, studentId: string, date: Date) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        guardians: {
          include: {
            guardian: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!student) return;

    for (const gLink of student.guardians) {
      const guardian = gLink.guardian;
      if (guardian.userId) {
        await this.comms.sendNotification({
          schoolId,
          userId: guardian.userId,
          type: 'STUDENT_ABSENT',
          data: {
            student_name: `${student.firstName} ${student.lastName}`,
            guardian_name: `${guardian.firstName} ${guardian.lastName}`,
            date: date.toLocaleDateString(),
          },
          priority: NotificationPriority.HIGH,
        });
      }
    }
  }

  async bulkMarkAttendance(schoolId: string, sessionId: string, dto: BulkMarkAttendanceDto, actorId: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id: sessionId, schoolId },
    });
    if (!session) throw new NotFoundException('Attendance session not found');

    if (session.status === AttendanceSessionStatus.LOCKED) {
      throw new ForbiddenException('Attendance session is locked');
    }

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const record of dto.records) {
        const enrollment = await tx.enrollment.findFirst({
          where: {
            studentId: record.studentId,
            academicYearId: session.academicYearId,
            schoolId,
            status: 'ACTIVE',
          },
        });

        if (!enrollment) continue;

        const res = await tx.studentAttendance.upsert({
          where: {
            attendanceSessionId_studentId: {
              attendanceSessionId: sessionId,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            minutesLate: record.minutesLate,
            reason: record.reason,
            remarks: record.remarks,
            updatedBy: actorId,
          },
          create: {
            ...record,
            schoolId,
            attendanceSessionId: sessionId,
            enrollmentId: enrollment.id,
            markedBy: actorId,
            markedAt: new Date(),
          },
        });
        results.push(res);
      }

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'ATTENDANCE_BULK_MARKED',
        module: 'ATTENDANCE',
        resourceId: sessionId,
        metadata: { count: dto.records.length },
      });

      // Trigger notifications for all absent students after transaction
      for (const record of dto.records) {
        if (record.status === AttendanceStatus.ABSENT) {
          await this.triggerAbsenceNotification(schoolId, record.studentId, session.date);
        }
      }

      this.gateway.broadcastToSchool(schoolId, 'ATTENDANCE_UPDATED', { sessionId });

      return results;
    });
  }

  async updateSessionStatus(schoolId: string, id: string, status: AttendanceSessionStatus, actorId: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id, schoolId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const updated = await this.prisma.attendanceSession.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: `ATTENDANCE_SESSION_${status}`,
      module: 'ATTENDANCE',
      resourceId: id,
    });

    return updated;
  }

  async findRecords(schoolId: string, filters: any = {}) {
    const { search, status, classId, startDate, endDate } = filters;
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    return this.prisma.studentAttendance.findMany({
      where: {
        schoolId,
        status: status || undefined,
        student: search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { studentNumber: { contains: search, mode: 'insensitive' } },
              ],
            }
          : undefined,
        session: {
          schoolId,
          classId: classId || undefined,
          date: Object.keys(dateFilter).length ? dateFilter : undefined,
        },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        session: {
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: [{ session: { date: 'desc' } }, { student: { lastName: 'asc' } }],
      take: 500,
    });
  }

  async findSessions(schoolId: string, filters: any = {}) {
    const where: any = { schoolId };
    for (const key of ['classId', 'sectionId', 'subjectId', 'academicYearId', 'termId', 'status'] as const) {
      const value = filters?.[key];
      if (typeof value === 'string' && value.trim()) where[key] = value.trim();
    }

    const date = typeof filters?.date === 'string' ? filters.date.trim() : '';
    if (date) {
      const start = new Date(date);
      if (!Number.isNaN(start.getTime())) {
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        where.date = { gte: start, lt: end };
      }
    }

    return this.prisma.attendanceSession.findMany({
      where,
      include: {
        class: true,
        section: true,
        subject: true,
        _count: {
          select: { records: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getSessionWithRecords(schoolId: string, id: string) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id, schoolId },
      include: {
        class: true,
        section: true,
        subject: true,
        records: {
          include: {
            student: true,
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
