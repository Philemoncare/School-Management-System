import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GuardianAccessService } from '../guardians/guardian-access.service';

@Injectable()
export class ParentPortalService {
  constructor(
    private prisma: PrismaService,
    private guardianAccess: GuardianAccessService,
  ) {}

  async getDashboard(userId: string, schoolId: string) {
    const students = await this.guardianAccess.getAuthorizedStudents(userId, schoolId);

    if (students.length === 0) {
      return {
        guardian: await this.prisma.guardian.findUnique({ where: { userId } }),
        students: [],
        announcements: await this.getAnnouncements(schoolId, []),
        notifications: await this.getNotifications(userId, schoolId),
      };
    }

    const studentIds = students.map((s) => s.id);
    const activeStudent = students[0]; // Default to first student

    // Fetch aggregated dashboard data
    const [
      announcements,
      notifications,
      attendance,
      upcomingAssessments,
      recentResults,
      outstandingFees,
      timetable,
    ] = await Promise.all([
      this.getAnnouncements(schoolId, studentIds),
      this.getNotifications(userId, schoolId),
      this.getAttendanceSummary(activeStudent.id),
      this.getUpcomingAssessments(activeStudent.id),
      this.getRecentResults(activeStudent.id),
      this.getOutstandingFees(activeStudent.id),
      this.getTodayTimetable(activeStudent.id),
    ]);

    return {
      guardian: await this.prisma.guardian.findUnique({ where: { userId } }),
      students,
      activeStudentId: activeStudent.id,
      summary: {
        attendance,
        upcomingAssessments,
        recentResults,
        outstandingFees,
        timetable,
      },
      announcements,
      notifications,
    };
  }

  private async getAnnouncements(schoolId: string, studentIds: string[]) {
    return this.prisma.announcement.findMany({
      where: {
        schoolId,
        status: 'PUBLISHED',
        OR: [
          { audiences: { some: { audienceType: 'ALL' } } },
          { audiences: { some: { audienceType: 'PARENTS' } } },
          { audiences: { some: { studentId: { in: studentIds } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  private async getNotifications(userId: string, schoolId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        schoolId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private async getAttendanceSummary(studentId: string) {
    const records = await this.prisma.studentAttendance.groupBy({
      by: ['status'],
      where: { studentId },
      _count: true,
    });

    return records.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getUpcomingAssessments(studentId: string) {
    // Need to find active enrollment first
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
    });

    if (!enrollment) return [];

    return this.prisma.assessment.findMany({
      where: {
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
        startDate: { gte: new Date() },
        status: 'PUBLISHED',
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    });
  }

  private async getRecentResults(studentId: string) {
    return this.prisma.subjectResult.findMany({
      where: {
        studentId,
        status: 'PUBLISHED',
      },
      include: {
        subject: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });
  }

  private async getOutstandingFees(studentId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        studentId,
        status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      select: {
        balance: true,
      },
    });

    return invoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
  }

  private async getTodayTimetable(studentId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
    });

    if (!enrollment) return [];

    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, ...

    return this.prisma.timetableEntry.findMany({
      where: {
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
        dayOfWeek,
      },
      include: {
        subject: true,
        teacher: true,
        room: true,
        period: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getChildProfile(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: true,
            section: true,
            academicYear: true,
          },
        },
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });
  }

  async getChildAcademics(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
      include: {
        class: {
          include: {
            classSubjects: {
              include: {
                subject: true,
              },
            },
          },
        },
        academicYear: true,
        term: true,
      },
    });

    if (!enrollment) throw new NotFoundException('Active enrollment not found');

    const [recentAssessments, publishedResults] = await Promise.all([
      this.prisma.assessment.findMany({
        where: {
          classId: enrollment.classId,
          sectionId: enrollment.sectionId,
          status: 'PUBLISHED',
        },
        take: 10,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.subjectResult.findMany({
        where: {
          studentId,
          status: 'PUBLISHED',
        },
        include: { subject: true },
        take: 10,
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    return {
      enrollment,
      recentAssessments,
      publishedResults,
    };
  }

  async getChildTimetable(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
    });

    if (!enrollment) throw new NotFoundException('Active enrollment not found');

    return this.prisma.timetableEntry.findMany({
      where: {
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
      },
      include: {
        subject: true,
        teacher: true,
        room: true,
        period: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async getChildAttendance(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    return this.prisma.studentAttendance.findMany({
      where: { studentId },
      include: {
        session: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { session: { date: 'desc' } },
      take: 50,
    });
  }

  async getChildFinance(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    const [invoices, payments, receipts] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { studentId },
        include: { items: true },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { studentId },
        include: { receipts: true },
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.receipt.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { invoices, payments, receipts };
  }

  async getChildResults(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    return this.prisma.subjectResult.findMany({
      where: {
        studentId,
        status: 'PUBLISHED',
      },
      include: {
        subject: true,
        academicYear: true,
        term: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getChildAssessments(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
    });

    if (!enrollment) return [];

    return this.prisma.assessment.findMany({
      where: {
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
        status: 'PUBLISHED',
      },
      include: {
        subject: true,
        assessmentType: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getChildAssignments(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
    });

    if (!enrollment) return [];

    return this.prisma.classAssignment.findMany({
      where: {
        classId: enrollment.classId,
        sectionId: enrollment.sectionId,
        status: 'PUBLISHED',
      },
      include: {
        subject: true,
        submissions: {
          where: { studentId },
        },
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  async getChildTransport(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    return this.prisma.transportAssignment.findMany({
      where: { studentId, status: 'ACTIVE' },
      include: {
        route: {
          include: {
            stops: true,
          },
        },
        pickupStop: true,
        dropoffStop: true,
      },
    });
  }

  async getChildLibrary(userId: string, schoolId: string, studentId: string) {
    await this.guardianAccess.validateStudentAccess(userId, schoolId, studentId);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { userId: true },
    });

    if (!student?.userId) return { loans: [], reservations: [], fines: [] };

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
}
