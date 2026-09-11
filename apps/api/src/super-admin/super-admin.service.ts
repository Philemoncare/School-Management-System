import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SchoolStatus, SubscriptionStatus, PlatformInvoiceStatus } from '@prisma/client';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getDashboardMetrics() {
    const [
      totalSchools,
      activeSchools,
      trialSchools,
      suspendedSchools,
      totalUsers,
      activeSubscriptions,
      revenueMetrics
    ] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
      this.prisma.school.count({ where: { status: SchoolStatus.TRIAL } }),
      this.prisma.school.count({ where: { status: SchoolStatus.SUSPENDED } }),
      this.prisma.user.count(),
      this.prisma.schoolSubscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.prisma.platformInvoice.aggregate({
        _sum: { total: true },
        where: { status: PlatformInvoiceStatus.PAID }
      })
    ]);

    return {
      schools: {
        total: totalSchools,
        active: activeSchools,
        trial: trialSchools,
        suspended: suspendedSchools,
      },
      users: {
        total: totalUsers,
      },
      subscriptions: {
        active: activeSubscriptions,
      },
      revenue: {
        totalPaid: revenueMetrics._sum.total || 0,
      },
    };
  }

  async getSchools(params: { skip?: number; take?: number; search?: string; status?: SchoolStatus }) {
    const { skip, take, search, status } = params;

    const where = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as any } },
          { code: { contains: search, mode: 'insensitive' as any } },
          { slug: { contains: search, mode: 'insensitive' as any } },
        ]
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip,
        take,
        include: {
          subscription: {
            include: { plan: true }
          },
          _count: {
            select: { students: true, teachers: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.school.count({ where })
    ]);

    return { items, total };
  }

  async getSchoolDetail(schoolId: string) {
    return this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: {
          include: { plan: true, pricing: true }
        },
        memberships: {
          include: { user: true }
        },
        usageLogs: {
          take: 5,
          orderBy: { billingPeriodStart: 'desc' }
        },
        platformInvoices: {
          take: 5,
          orderBy: { issueDate: 'desc' }
        },
        _count: {
          select: { students: true, teachers: true, staff: true }
        }
      }
    });
  }

  async updateSchoolStatus(schoolId: string, status: SchoolStatus, actorId: string) {
    const school = await this.prisma.school.update({
      where: { id: schoolId },
      data: { status }
    });

    await this.audit.log({
      userId: actorId,
      schoolId: schoolId,
      action: 'SCHOOL_STATUS_UPDATED',
      module: 'SCHOOLS',
      resourceId: schoolId,
      metadata: { newStatus: status }
    });

    return school;
  }
}
