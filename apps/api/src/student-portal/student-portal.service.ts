import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentAccessService } from '../students/student-access.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class StudentPortalService {
  constructor(
    private prisma: PrismaService,
    private studentAccess: StudentAccessService,
    private audit: AuditService,
  ) {}

  async getDashboard(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const enrollment = student.enrollments[0];

    if (!enrollment) {
      return {
        student,
        timetable: [],
        assessments: [],
        assignments: [],
        announcements: [],
        notifications: [],
        attendance: { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 },
      };
    }

    const dayOfWeek = new Date().getDay();

    const [timetable, assessments, assignments, announcements, notifications, attendanceGroup] = await Promise.all([
      this.prisma.timetableEntry.findMany({
        where: { classId: enrollment.classId, sectionId: enrollment.sectionId, dayOfWeek, schoolId },
        include: { subject: true, teacher: true, room: true, period: true },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.assessment.findMany({
        where: { classId: enrollment.classId, sectionId: enrollment.sectionId, status: 'PUBLISHED', schoolId },
        include: { subject: true },
        take: 5,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.classAssignment.findMany({
        where: { classId: enrollment.classId, sectionId: enrollment.sectionId, status: 'PUBLISHED', schoolId },
        include: { subject: true, submissions: { where: { studentId: student.id } } },
        take: 5,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.announcement.findMany({
        where: {
          schoolId,
          status: 'PUBLISHED',
          OR: [
            { audiences: { some: { audienceType: 'ALL' } } },
            { audiences: { some: { audienceType: 'STUDENTS' } } },
            { audiences: { some: { classId: enrollment.classId } } },
          ],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.findMany({
        where: { userId, schoolId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.studentAttendance.groupBy({
        by: ['status'],
        where: { studentId: student.id },
        _count: true,
      }),
    ]);

    const attendance = attendanceGroup.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      student,
      enrollment,
      timetable,
      assessments,
      assignments,
      announcements,
      notifications,
      attendance,
    };
  }

  async getProfile(userId: string, schoolId: string) {
    return this.studentAccess.getStudentProfile(userId, schoolId);
  }

  async getClassesAndSubjects(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const enrollment = student.enrollments[0];
    if (!enrollment) return [];

    return this.prisma.classSubject.findMany({
      where: { classId: enrollment.classId, sectionId: enrollment.sectionId, schoolId },
      include: {
        class: true,
        section: true,
        subject: {
          include: {
            teacherAssignments: {
              where: { sectionId: enrollment.sectionId || '', status: 'ACTIVE' },
              include: { teacher: true },
            },
          },
        },
      },
    });
  }

  async getTimetable(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const enrollment = student.enrollments[0];
    if (!enrollment) return [];

    return this.prisma.timetableEntry.findMany({
      where: { classId: enrollment.classId, sectionId: enrollment.sectionId, schoolId },
      include: { subject: true, teacher: true, room: true, period: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getAttendance(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    return this.prisma.studentAttendance.findMany({
      where: { studentId: student.id, schoolId },
      include: { session: { include: { subject: true } } },
      orderBy: { session: { date: 'desc' } },
    });
  }

  async getAssessments(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const enrollment = student.enrollments[0];
    if (!enrollment) return [];

    return this.prisma.assessment.findMany({
      where: { classId: enrollment.classId, sectionId: enrollment.sectionId, status: 'PUBLISHED', schoolId },
      include: { subject: true, assessmentType: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async getAssignments(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const enrollment = student.enrollments[0];
    if (!enrollment) return [];

    return this.prisma.classAssignment.findMany({
      where: { classId: enrollment.classId, sectionId: enrollment.sectionId, status: 'PUBLISHED', schoolId },
      include: { subject: true, teacher: true, submissions: { where: { studentId: student.id } } },
      orderBy: { dueDate: 'desc' },
    });
  }

  async submitAssignment(userId: string, schoolId: string, assignmentId: string, fileUrl: string, content: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const assignment = await this.prisma.classAssignment.findFirst({
      where: { id: assignmentId, schoolId, status: 'PUBLISHED' },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found or closed.');
    }

    const existingSubmission = await this.prisma.classAssignmentSubmission.findFirst({
      where: { assignmentId, studentId: student.id },
    });

    let submission;
    const isLate = new Date() > assignment.dueDate;
    if (existingSubmission) {
      submission = await this.prisma.classAssignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          fileUrl,
          content,
          submittedAt: new Date(),
          status: isLate ? 'LATE' : 'SUBMITTED',
        },
      });
    } else {
      submission = await this.prisma.classAssignmentSubmission.create({
        data: {
          assignmentId,
          studentId: student.id,
          fileUrl,
          content,
          status: isLate ? 'LATE' : 'SUBMITTED',
        },
      });
    }

    await this.audit.log({
      userId,
      schoolId,
      action: 'STUDENT_SUBMISSION_SUBMITTED',
      module: 'ACADEMICS',
      resourceId: submission.id,
    });

    return submission;
  }

  async getResults(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    return this.prisma.subjectResult.findMany({
      where: { studentId: student.id, schoolId, status: 'PUBLISHED' },
      include: { subject: true, academicYear: true, term: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getFeesAndInvoices(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const [invoices, payments, receipts] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { studentId: student.id, schoolId },
        include: { items: true },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { studentId: student.id, schoolId },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.receipt.findMany({
        where: { studentId: student.id, schoolId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { invoices, payments, receipts };
  }

  async getLibraryLoans(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    if (!student.userId) return { loans: [], reservations: [], fines: [] };

    const membership = await this.prisma.libraryMembership.findUnique({
      where: { schoolId_userId: { schoolId, userId: student.userId } },
    });

    if (!membership) return { loans: [], reservations: [], fines: [] };

    const [loans, reservations, fines] = await Promise.all([
      this.prisma.libraryLoan.findMany({
        where: { membershipId: membership.id },
        include: { bookCopy: { include: { book: true } } },
      }),
      this.prisma.libraryReservation.findMany({
        where: { membershipId: membership.id },
        include: { book: true },
      }),
      this.prisma.libraryFine.findMany({
        where: { membershipId: membership.id },
      }),
    ]);

    return { loans, reservations, fines };
  }

  async getTransportAssignment(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    return this.prisma.transportAssignment.findMany({
      where: { studentId: student.id, schoolId, status: 'ACTIVE' },
      include: { route: true, pickupStop: true, dropoffStop: true },
    });
  }

  async getAnnouncements(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const enrollment = student.enrollments[0];
    if (!enrollment) return [];

    return this.prisma.announcement.findMany({
      where: {
        schoolId,
        status: 'PUBLISHED',
        OR: [
          { audiences: { some: { audienceType: 'ALL' } } },
          { audiences: { some: { audienceType: 'STUDENTS' } } },
          { audiences: { some: { classId: enrollment.classId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeachers(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const enrollment = student.enrollments[0];
    if (!enrollment) return [];

    return this.prisma.teacherAssignment.findMany({
      where: { sectionId: enrollment.sectionId || '', status: 'ACTIVE' },
      include: { teacher: true, subject: true },
    });
  }

  async getExaminations(userId: string, schoolId: string) {
    const student = await this.studentAccess.getStudentProfile(userId, schoolId);
    const enrollment = student.enrollments[0];
    if (!enrollment) return [];

    return this.prisma.examinationSession.findMany({
      where: { classId: enrollment.classId, sectionId: enrollment.sectionId },
      include: { subject: true, room: true, period: true },
      orderBy: { date: 'asc' },
    });
  }

  async getSchoolInfo(userId: string, schoolId: string) {
    return this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        logo: true,
        address: true,
        phone: true,
        email: true,
        timezone: true,
      },
    });
  }
}
