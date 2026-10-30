import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentStatus, StaffStatus, AttendanceStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class SchoolDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics(schoolId: string) {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const [
      studentCount,
      teacherCount,
      staffCount,
      activeClasses,
      attendanceToday,
      financeMetrics,
      recentActivity,
      announcements,
      currentYear,
    ] = await Promise.all([
      // Counts
      this.prisma.student.count({ where: { schoolId, status: StudentStatus.ACTIVE } }),
      this.prisma.teacher.count({ where: { schoolId, status: StaffStatus.ACTIVE } }),
      this.prisma.staff.count({ where: { schoolId, status: StaffStatus.ACTIVE } }),
      this.prisma.class.count({ where: { schoolId, isActive: true } }),

      // Attendance Today
      this.prisma.studentAttendance.groupBy({
        by: ['status'],
        where: {
          schoolId,
          createdAt: { gte: startOfToday },
        },
        _count: true,
      }),

      // Finance
      this.prisma.invoice.aggregate({
        _sum: { balance: true, totalAmount: true },
        where: { schoolId, status: { notIn: [InvoiceStatus.VOID, InvoiceStatus.CANCELLED] } },
      }),

      // Recent Activity (from AuditLog)
      this.prisma.auditLog.findMany({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Announcements
      this.prisma.announcement.findMany({
        where: {
          schoolId,
          status: 'PUBLISHED',
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),

      // Current Academic Context
      this.prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
        include: { terms: { where: { status: 'ACTIVE' }, take: 1 } },
      }),
    ]);

    // Calculate attendance rate
    const attMap: Record<string, number> = {};
    attendanceToday.forEach((a) => (attMap[a.status] = a._count));
    const present = (attMap[AttendanceStatus.PRESENT] || 0) + (attMap[AttendanceStatus.LATE] || 0);
    const totalAtt = attendanceToday.reduce((sum, a) => sum + a._count, 0);
    const attendanceRate = totalAtt > 0 ? (present / totalAtt) * 100 : 0;

    return {
      stats: {
        students: studentCount,
        teachers: teacherCount,
        staff: staffCount,
        activeClasses,
        attendanceRate: attendanceRate.toFixed(1) + '%',
        outstandingFees: financeMetrics._sum.balance || 0,
        totalInvoiced: financeMetrics._sum.totalAmount || 0,
      },
      academicContext: {
        year: currentYear?.name || 'Not Set',
        term: currentYear?.terms[0]?.name || 'Not Set',
      },
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        module: log.module,
        user: log.userId || 'System',
        time: log.createdAt,
      })),
      announcements,
    };
  }

  async getFullActivityLog(
    schoolId: string,
    filters: { search?: string; module?: string } = {},
  ) {
    const module = typeof filters.module === 'string' ? filters.module.trim() : '';
    const search = typeof filters.search === 'string' ? filters.search.trim().toLowerCase() : '';

    const logs = await this.prisma.auditLog.findMany({
      where: {
        schoolId,
        ...(module ? { module: { equals: module, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const userIds = Array.from(
      new Set(logs.map((log) => log.userId).filter((id): id is string => Boolean(id))),
    );
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    const enriched = logs.map((log) => ({
      ...log,
      user: log.userId ? userMap.get(log.userId) ?? null : null,
    }));

    if (!search) return enriched;

    return enriched.filter((log) => {
      const haystack = [
        log.action,
        log.module,
        log.resourceId,
        log.user?.firstName,
        log.user?.lastName,
        log.user?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }
}
