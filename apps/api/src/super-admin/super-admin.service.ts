import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailProvider } from '../communication/providers/email.provider';
import { SmsService } from '../sms/sms.service';
import { GrantSmsCreditsDto } from '../sms/dto/sms-package.dto';
import {
  AnnouncementStatus,
  BillingInterval,
  CommunicationChannel,
  DeliveryStatus,
  IncidentStatus,
  MaintenanceStatus,
  NotificationPriority,
  NotificationStatus,
  PlatformInvoiceStatus,
  PlatformPaymentStatus,
  PlanStatus,
  Prisma,
  SchoolStatus,
  SecuritySeverity,
  SessionStatus,
  SubscriptionStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

const ACTIVE_SUBSCRIPTION_STATUSES = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
];

const SCHOOL_STATUS_FLOW: Record<SchoolStatus, SchoolStatus[]> = {
  PENDING: [SchoolStatus.ACTIVE, SchoolStatus.REJECTED],
  ACTIVE: [
    SchoolStatus.SUSPENDED,
    SchoolStatus.MAINTENANCE,
    SchoolStatus.EXPIRED,
    SchoolStatus.DEACTIVATED,
  ],
  TRIAL: [
    SchoolStatus.ACTIVE,
    SchoolStatus.SUSPENDED,
    SchoolStatus.EXPIRED,
    SchoolStatus.DEACTIVATED,
  ],
  SUSPENDED: [SchoolStatus.ACTIVE, SchoolStatus.DEACTIVATED],
  MAINTENANCE: [SchoolStatus.ACTIVE, SchoolStatus.SUSPENDED],
  EXPIRED: [SchoolStatus.ACTIVE, SchoolStatus.DEACTIVATED],
  REJECTED: [SchoolStatus.PENDING, SchoolStatus.ACTIVE],
  DEACTIVATED: [SchoolStatus.ACTIVE],
};

type SettingsWithKeyValues = Array<{ key: string; value: Prisma.JsonValue }>;

/**
 * Outcome of a trial-grant attempt. Uses a string discriminant rather than a
 * boolean flag on purpose: this project compiles the API with `strict: false`,
 * so `strictNullChecks` is off and a `{ ok: true } | { ok: false }` union does
 * not narrow at the call site - reading `.reason` on the failure branch is a
 * compile error. String literals narrow correctly regardless.
 */
export type TrialGrantOutcome =
  | { kind: 'granted'; subscription: any }
  | { kind: 'not_granted'; reason: string };

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private emailProvider: EmailProvider,
    private sms: SmsService,
  ) {}

  private number(value: Prisma.Decimal | number | string | null | undefined) {
    return Number(value ?? 0);
  }

  private intervalMonths(interval: BillingInterval) {
    return {
      MONTHLY: 1,
      QUARTERLY: 3,
      SEMI_ANNUAL: 6,
      ANNUAL: 12,
    }[interval];
  }

  private getSetting(settings: SettingsWithKeyValues | undefined, key: string) {
    const value = settings?.find((setting) => setting.key === key)?.value;
    return typeof value === 'string' ? value : value == null ? null : String(value);
  }

  private mapSchool(school: any) {
    return {
      ...school,
      region: this.getSetting(school.schoolSettings, 'region'),
      district: this.getSetting(school.schoolSettings, 'district'),
      city: this.getSetting(school.schoolSettings, 'city'),
      schoolType: this.getSetting(school.schoolSettings, 'school_type'),
    };
  }

  private dateRange(from?: string, to?: string) {
    const range: { gte?: Date; lte?: Date } = {};
    if (from) {
      const date = new Date(from);
      if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid start date');
      range.gte = date;
    }
    if (to) {
      const date = new Date(to);
      if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid end date');
      range.lte = date;
    }
    return Object.keys(range).length ? range : undefined;
  }

  private async billingMetrics() {
    const [subscriptions, paymentsAgg, invoices, invoiceGroups, paymentGroups, recentPayments] =
      await Promise.all([
        this.prisma.schoolSubscription.findMany({
          where: { status: { in: ACTIVE_SUBSCRIPTION_STATUSES } },
          include: { pricing: true },
        }),
        this.prisma.platformPayment.aggregate({
          _sum: { amount: true },
          where: { status: PlatformPaymentStatus.SUCCESS },
        }),
        this.prisma.platformInvoice.findMany({
          where: { status: { in: [PlatformInvoiceStatus.ISSUED, PlatformInvoiceStatus.OVERDUE] } },
          include: { payments: { where: { status: PlatformPaymentStatus.SUCCESS }, select: { amount: true } } },
        }),
        this.prisma.platformInvoice.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.platformPayment.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.platformPayment.findMany({
          take: 5,
          orderBy: { paymentDate: 'desc' },
          include: {
            school: { select: { id: true, name: true } },
            invoice: { select: { invoiceNumber: true, status: true } },
          },
        }),
      ]);

    const mrr = subscriptions.reduce((sum, subscription) => {
      const months = this.intervalMonths(subscription.pricing.interval);
      return sum + this.number(subscription.pricing.amount) / months;
    }, 0);

    const outstanding = invoices.reduce((sum, invoice) => {
      const paid = invoice.payments.reduce((paymentSum, payment) => paymentSum + this.number(payment.amount), 0);
      return sum + Math.max(0, this.number(invoice.total) - paid);
    }, 0);

    const invoiceCounts = Object.fromEntries(
      invoiceGroups.map((group) => [group.status, group._count._all]),
    ) as Record<string, number>;
    const paymentCounts = Object.fromEntries(
      paymentGroups.map((group) => [group.status, group._count._all]),
    ) as Record<string, number>;

    return {
      currency: subscriptions[0]?.pricing.currency || 'GHS',
      mrr: Number(mrr.toFixed(2)),
      arr: Number((mrr * 12).toFixed(2)),
      totalPaid: Number(this.number(paymentsAgg._sum.amount).toFixed(2)),
      outstanding: Number(outstanding.toFixed(2)),
      activeSubscriptions: subscriptions.filter((s) => s.status === SubscriptionStatus.ACTIVE).length,
      pastDueSubscriptions: subscriptions.filter((s) => s.status === SubscriptionStatus.PAST_DUE).length,
      invoiceCounts,
      paymentCounts,
      recentPayments,
    };
  }

  async getDashboardMetrics() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalSchools,
      schoolGroups,
      totalUsers,
      activeUsers,
      newUsers,
      subscriptionGroups,
      billing,
      recentSchools,
      pendingSchools,
      recentSecurityEvents,
      recentAuditLogs,
      schoolsHistory,
    ] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.schoolSubscription.groupBy({ by: ['status'], _count: { _all: true } }),
      this.billingMetrics(),
      this.prisma.school.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, code: true, status: true, createdAt: true },
      }),
      this.prisma.school.findMany({
        take: 5,
        where: { status: SchoolStatus.PENDING },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, code: true, status: true, createdAt: true },
      }),
      this.prisma.securityEvent.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      this.prisma.school.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
    ]);

    const schoolCounts = Object.fromEntries(
      schoolGroups.map((group) => [group.status, group._count._all]),
    ) as Record<string, number>;
    const subscriptionCounts = Object.fromEntries(
      subscriptionGroups.map((group) => [group.status, group._count._all]),
    ) as Record<string, number>;

    const monthlyGrowth = Array.from({ length: 6 }).map((_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        count: schoolsHistory.filter(
          (school) =>
            school.createdAt.getMonth() === date.getMonth() &&
            school.createdAt.getFullYear() === date.getFullYear(),
        ).length,
      };
    });

    const actorIds = [...new Set(recentAuditLogs.map((log) => log.userId).filter(Boolean))] as string[];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const actorMap = new Map(actors.map((actor) => [actor.id, actor]));

    return {
      schools: {
        total: totalSchools,
        pending: schoolCounts.PENDING || 0,
        active: schoolCounts.ACTIVE || 0,
        trial: schoolCounts.TRIAL || 0,
        suspended: schoolCounts.SUSPENDED || 0,
        expired: schoolCounts.EXPIRED || 0,
        maintenance: schoolCounts.MAINTENANCE || 0,
        rejected: schoolCounts.REJECTED || 0,
        deactivated: schoolCounts.DEACTIVATED || 0,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        disabled: totalUsers - activeUsers,
        newThisMonth: newUsers,
      },
      subscriptions: {
        active: subscriptionCounts.ACTIVE || 0,
        trialing: subscriptionCounts.TRIALING || 0,
        pastDue: subscriptionCounts.PAST_DUE || 0,
      },
      revenue: {
        totalPaid: billing.totalPaid,
        mrr: billing.mrr,
        outstanding: billing.outstanding,
        currency: billing.currency,
      },
      recentSchools,
      pendingSchools,
      recentSecurityEvents,
      recentAuditLogs: recentAuditLogs.map((log) => ({
        ...log,
        actor: log.userId ? actorMap.get(log.userId) || null : null,
      })),
      monthlyGrowth,
    };
  }

  async getSchools(params: {
    skip?: number;
    take?: number;
    search?: string;
    statuses?: SchoolStatus[];
    region?: string;
    schoolType?: string;
    from?: string;
    to?: string;
    sort?: 'name';
  }) {
    const skip = Math.max(0, params.skip ?? 0);
    const take = Math.min(100, Math.max(1, params.take ?? 10));
    const createdAt = this.dateRange(params.from, params.to);
    const where: Prisma.SchoolWhereInput = {
      ...(params.statuses?.length ? { status: { in: params.statuses } } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { code: { contains: params.search, mode: 'insensitive' } },
              { slug: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
              { phone: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params.region
        ? { schoolSettings: { some: { key: 'region', value: { equals: params.region } } } }
        : {}),
      ...(params.schoolType
        ? { schoolSettings: { some: { key: 'school_type', value: { equals: params.schoolType } } } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip,
        take,
        include: {
          subscription: { include: { plan: true } },
          schoolSettings: {
            where: { key: { in: ['region', 'district', 'city', 'school_type'] } },
            select: { key: true, value: true },
          },
          _count: { select: { students: true, teachers: true } },
        },
        orderBy:
          params.sort === 'name'
            ? [{ name: 'asc' }]
            : [{ createdAt: 'desc' }],
      }),
      this.prisma.school.count({ where }),
    ]);

    return { items: items.map((school) => this.mapSchool(school)), total, skip, take };
  }

  async getSchoolFilters() {
    const [statusGroups, regionSettings, typeSettings] = await Promise.all([
      this.prisma.school.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.schoolSetting.findMany({
        where: { key: 'region' },
        select: { value: true },
        distinct: ['value'],
      }),
      this.prisma.schoolSetting.findMany({
        where: { key: 'school_type' },
        select: { value: true },
        distinct: ['value'],
      }),
    ]);

    const values = (settings: Array<{ value: Prisma.JsonValue }>) =>
      [...new Set(settings.map((setting) => String(setting.value)).filter(Boolean))].sort();

    return {
      statuses: statusGroups.map((group) => ({ status: group.status, count: group._count._all })),
      regions: values(regionSettings),
      schoolTypes: values(typeSettings),
    };
  }

  async getSchoolDetail(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        subscription: { include: { plan: true, pricing: true } },
        schoolSettings: true,
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                isActive: true,
                emailVerified: true,
                accountState: true,
                createdAt: true,
                updatedAt: true,
                userRoles: { include: { role: true } },
              },
            },
          },
        },
        usageLogs: { take: 5, orderBy: { billingPeriodStart: 'desc' } },
        platformInvoices: {
          take: 10,
          orderBy: { issueDate: 'desc' },
          include: {
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
        _count: { select: { students: true, teachers: true, staff: true } },
      },
    });

    if (!school) throw new NotFoundException('School not found');

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { schoolId },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return { ...this.mapSchool(school), auditLogs };
  }

  async provisionSchool(
    dto: {
      name: string;
      code: string;
      slug?: string;
      email?: string;
      phone?: string;
      address?: string;
      timezone?: string;
      currency?: string;
      region?: string;
      district?: string;
      city?: string;
      schoolType?: string;
      status?: SchoolStatus;
      adminFirstName: string;
      adminLastName: string;
      adminEmail: string;
      adminPassword?: string;
      planId?: string;
    },
    actorId: string,
  ) {
    const code = dto.code.trim().toUpperCase();
    const slug = (dto.slug || code.toLowerCase().replace(/[^a-z0-9]/g, '-')).trim().toLowerCase();
    const adminEmail = dto.adminEmail.trim().toLowerCase();

    const existing = await this.prisma.school.findFirst({
      where: { OR: [{ code }, { slug }] },
      select: { code: true, slug: true },
    });
    if (existing) {
      throw new BadRequestException(
        existing.code === code ? `School code '${code}' already exists` : `School slug '${slug}' already exists`,
      );
    }

    const generatedPassword = dto.adminPassword ? null : `${randomBytes(9).toString('base64url')}aA1!`;
    const password = dto.adminPassword || generatedPassword!;
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const plan = dto.planId
      ? await this.prisma.subscriptionPlan.findUnique({
          where: { id: dto.planId },
          include: { pricing: { where: { isActive: true } } },
        })
      : null;
    if (dto.planId && !plan) throw new NotFoundException('Subscription plan not found');
    if (plan?.status === 'ARCHIVED') throw new BadRequestException('Cannot assign an archived plan');

    const result = await this.prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: dto.name.trim(),
          code,
          slug,
          email: dto.email || null,
          phone: dto.phone || null,
          address: dto.address || null,
          timezone: dto.timezone || 'UTC',
          currency: dto.currency || 'GHS',
          status: dto.status || SchoolStatus.ACTIVE,
        },
      });

      const settings = [
        dto.region ? { key: 'region', value: dto.region } : null,
        dto.district ? { key: 'district', value: dto.district } : null,
        dto.city ? { key: 'city', value: dto.city } : null,
        dto.schoolType ? { key: 'school_type', value: dto.schoolType } : null,
      ].filter(Boolean) as Array<{ key: string; value: string }>;
      if (settings.length) {
        await tx.schoolSetting.createMany({
          data: settings.map((setting) => ({ schoolId: school.id, ...setting })),
        });
      }

      let user = await tx.user.findUnique({ where: { email: adminEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: adminEmail,
            passwordHash,
            firstName: dto.adminFirstName.trim(),
            lastName: dto.adminLastName.trim(),
            accountState: 'ACTIVE',
            emailVerified: new Date(),
            isActive: true,
          },
        });
      }

      let role = await tx.role.findFirst({ where: { name: 'SCHOOL_ADMIN', schoolId: school.id } });
      if (!role) {
        role = await tx.role.create({
          data: {
            name: 'SCHOOL_ADMIN',
            description: 'Administrator for this school instance',
            schoolId: school.id,
            isSystem: true,
          },
        });
      }

      const existingRole = await tx.userRole.findFirst({
        where: { userId: user.id, roleId: role.id, schoolId: school.id },
      });
      if (!existingRole) {
        await tx.userRole.create({ data: { userId: user.id, roleId: role.id, schoolId: school.id } });
      }

      const existingMembership = await tx.schoolMembership.findFirst({
        where: { schoolId: school.id, userId: user.id },
      });
      if (!existingMembership) {
        await tx.schoolMembership.create({
          data: { schoolId: school.id, userId: user.id, status: 'ACTIVE' },
        });
      }

      if (plan) {
        const pricing = plan.pricing[0];
        if (!pricing) throw new BadRequestException('Selected plan has no active pricing');
        const months = this.intervalMonths(pricing.interval);
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + months);
        await tx.schoolSubscription.create({
          data: {
            schoolId: school.id,
            planId: plan.id,
            pricingId: pricing.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          },
        });
      }

      await this.audit.log(
        {
          userId: actorId,
          schoolId: school.id,
          action: 'SCHOOL_PROVISIONED',
          module: 'SCHOOLS',
          resourceId: school.id,
          metadata: {
            name: school.name,
            code: school.code,
            adminEmail,
            generatedPassword: Boolean(generatedPassword),
            planId: plan?.id,
          },
        },
        tx,
      );

      return { ...school, adminTemporaryPassword: generatedPassword };
    });

    return result;
  }

  async updateSchool(
    schoolId: string,
    dto: {
      name?: string;
      code?: string;
      slug?: string;
      email?: string;
      phone?: string;
      address?: string;
      timezone?: string;
      currency?: string;
      region?: string;
      district?: string;
      city?: string;
      schoolType?: string;
      logo?: string;
    },
    actorId: string,
  ) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    if (dto.code && dto.code.trim().toUpperCase() !== school.code) {
      const duplicate = await this.prisma.school.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
      if (duplicate) throw new BadRequestException('School code is already in use');
    }
    if (dto.slug && dto.slug !== school.slug) {
      const duplicate = await this.prisma.school.findUnique({ where: { slug: dto.slug } });
      if (duplicate) throw new BadRequestException('School slug is already in use');
    }

    const { region, district, city, schoolType, ...schoolData } = dto;
    const settingData = { region, district, city, school_type: schoolType };
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.school.update({
        where: { id: schoolId },
        data: {
          ...schoolData,
          ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}),
          ...(dto.slug ? { slug: dto.slug.trim().toLowerCase() } : {}),
        },
      });

      for (const [key, value] of Object.entries(settingData)) {
        if (value === undefined) continue;
        await tx.schoolSetting.upsert({
          where: { schoolId_key: { schoolId, key } },
          update: { value },
          create: { schoolId, key, value },
        });
      }

      await this.audit.log(
        {
          userId: actorId,
          schoolId,
          action: 'SCHOOL_DETAILS_UPDATED',
          module: 'SCHOOLS',
          resourceId: schoolId,
          metadata: { changedFields: Object.keys(dto) },
        },
        tx,
      );

      return result;
    });

    return updated;
  }

  /**
   * Billing start state for a school that has just been approved.
   *
   * Approval used to flip `School.status` and nothing else, so
   * `school_subscriptions` stayed empty forever and every revenue, MRR,
   * subscription and expiry figure on the platform dashboards was permanently
   * zero no matter how many schools came through registration.
   *
   * The trial plan is resolved from the live catalogue (ACTIVE plans that
   * declare `trialDays > 0`, lowest `displayOrder` first) instead of a
   * hardcoded plan id, so renaming or re-ordering plans in Super Admin keeps
   * working. Idempotent: a school that already carries a subscription is left
   * untouched, which makes a repeated approve/reactivate safe.
   *
   * Returns the outcome rather than throwing: a billing configuration gap must
   * not block a school from being activated, but the caller gets the reason so
   * it can be surfaced instead of silently swallowed.
   */
  private async grantTrialSubscription(
    tx: Prisma.TransactionClient,
    schoolId: string,
    actorId: string,
  ): Promise<TrialGrantOutcome> {
    const existing = await tx.schoolSubscription.findUnique({
      where: { schoolId },
      include: { plan: { select: { id: true, name: true, code: true } } },
    });
    if (existing) {
      return { kind: 'not_granted', reason: `already_on_${existing.plan.code.toLowerCase()}` };
    }

    const plan = await tx.subscriptionPlan.findFirst({
      where: { status: PlanStatus.ACTIVE, trialDays: { gt: 0 } },
      include: { pricing: { where: { isActive: true } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    if (!plan) return { kind: 'not_granted', reason: 'no_active_trial_plan' };

    const pricing = plan.pricing[0];
    if (!pricing) return { kind: 'not_granted', reason: `plan_${plan.code}_has_no_active_pricing` };

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + plan.trialDays);
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + this.intervalMonths(pricing.interval));

    const subscription = await tx.schoolSubscription.create({
      data: {
        schoolId,
        planId: plan.id,
        pricingId: pricing.id,
        status: SubscriptionStatus.TRIALING,
        startDate: now,
        trialStart: now,
        trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: { select: { id: true, name: true, code: true } }, pricing: true },
    });

    await this.audit.log(
      {
        userId: actorId,
        schoolId,
        action: 'SUBSCRIPTION_TRIAL_GRANTED',
        module: 'BILLING',
        resourceId: subscription.id,
        metadata: {
          planId: plan.id,
          planCode: plan.code,
          pricingId: pricing.id,
          interval: pricing.interval,
          trialDays: plan.trialDays,
          trialEnd,
          triggeredBy: 'SCHOOL_APPROVAL',
        },
      },
      tx,
    );

    return { kind: 'granted', subscription };
  }

  async updateSchoolStatus(schoolId: string, status: SchoolStatus, actorId: string, reason?: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');
    if (school.status === status) throw new BadRequestException(`School is already ${status}`);

    const allowed = SCHOOL_STATUS_FLOW[school.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot move school from ${school.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }
    if ((status === SchoolStatus.SUSPENDED || status === SchoolStatus.REJECTED) && !reason?.trim()) {
      throw new BadRequestException('A reason is required for this status change');
    }

    const actionMap: Partial<Record<SchoolStatus, string>> = {
      ACTIVE: school.status === SchoolStatus.PENDING || school.status === SchoolStatus.REJECTED ? 'SCHOOL_APPROVED' : 'SCHOOL_REACTIVATED',
      REJECTED: 'SCHOOL_REJECTED',
      SUSPENDED: 'SCHOOL_SUSPENDED',
      MAINTENANCE: 'SCHOOL_MAINTENANCE_MODE',
      EXPIRED: 'SCHOOL_EXPIRED',
      DEACTIVATED: 'SCHOOL_DEACTIVATED',
      PENDING: 'SCHOOL_RETURNED_TO_PENDING',
    };

    const isApproval = actionMap[status] === 'SCHOOL_APPROVED';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.school.update({ where: { id: schoolId }, data: { status } });
      await this.audit.log(
        {
          userId: actorId,
          schoolId,
          action: actionMap[status] || 'SCHOOL_STATUS_UPDATED',
          module: 'SCHOOLS',
          resourceId: schoolId,
          metadata: { previousStatus: school.status, newStatus: status, reason: reason || null },
        },
        tx,
      );
      if (!isApproval) return updated;

      // Approval is also the point where a tenant enters billing. Without this
      // the subscription table never fills and the whole billing pipeline reads
      // as broken even though every endpoint answered correctly.
      const trialGrant = await this.grantTrialSubscription(tx, schoolId, actorId);
      return { ...updated, trialGrant };
    });
  }

  /**
   * Repairs the historical gap left before approval started granting trials:
   * tenants parked in TRIAL that own no SchoolSubscription row. Those schools
   * made every billing surface read as empty even though the endpoints were
   * answering correctly.
   *
   * Deliberately reuses grantTrialSubscription rather than writing rows here,
   * so a backfilled school gets exactly what a newly approved school gets
   * (same plan resolution, same dates, same audit action) and the operation
   * stays idempotent - running it twice grants nothing the second time.
   *
   * Only TRIAL tenants are touched. An ACTIVE school with no subscription is
   * reported, not silently given a paid plan - creating a billing record for a
   * payment that never happened would be fabrication.
   */
  async backfillTrialSubscriptions(actorId: string, dryRun = false) {
    const orphans = await this.prisma.school.findMany({
      where: { status: SchoolStatus.TRIAL, subscription: { is: null } },
      select: { id: true, name: true, code: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const activeWithoutSubscription = await this.prisma.school.count({
      where: { status: SchoolStatus.ACTIVE, subscription: { is: null } },
    });

    if (dryRun) {
      return {
        dryRun: true,
        candidates: orphans.length,
        schools: orphans,
        activeWithoutSubscription,
      };
    }

    const granted: Array<{ schoolId: string; planCode: string; trialEnd: Date | null }> = [];
    const skipped: Array<{ schoolId: string; reason: string }> = [];

    for (const school of orphans) {
      // One transaction per school: a failure on tenant 7 must not roll back
      // the six tenants that already succeeded.
      const outcome = await this.prisma.$transaction((tx) =>
        this.grantTrialSubscription(tx, school.id, actorId),
      );
      if (outcome.kind === 'granted') {
        granted.push({
          schoolId: school.id,
          planCode: outcome.subscription.plan?.code,
          trialEnd: outcome.subscription.trialEnd,
        });
      } else {
        skipped.push({ schoolId: school.id, reason: outcome.reason });
      }
    }

    if (granted.length) {
      await this.audit.log({
        userId: actorId,
        action: 'SUBSCRIPTION_TRIAL_BACKFILLED',
        module: 'BILLING',
        metadata: {
          candidates: orphans.length,
          granted: granted.length,
          skipped: skipped.length,
          grantedSchoolIds: granted.map((g) => g.schoolId),
          skipReasons: Array.from(new Set(skipped.map((s) => s.reason))),
        },
      });
    }

    return {
      dryRun: false,
      candidates: orphans.length,
      granted: granted.length,
      skipped: skipped.length,
      activeWithoutSubscription,
      results: granted,
      skippedReasons: skipped,
    };
  }

  async assignSubscription(
    schoolId: string,
    dto: { planId: string; pricingId?: string; status?: SubscriptionStatus },
    actorId: string,
  ) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
      include: { pricing: true },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if (plan.status === 'ARCHIVED') throw new BadRequestException('Cannot assign an archived plan');

    const pricing = dto.pricingId
      ? plan.pricing.find((item) => item.id === dto.pricingId)
      : plan.pricing.find((item) => item.isActive);
    if (!pricing) throw new BadRequestException('Plan has no active pricing tier configured');

    const months = this.intervalMonths(pricing.interval);
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + months);
    const status = dto.status || SubscriptionStatus.ACTIVE;

    const subscription = await this.prisma.schoolSubscription.upsert({
      where: { schoolId },
      update: {
        planId: plan.id,
        pricingId: pricing.id,
        status,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        endedAt: null,
        suspendedAt: status === SubscriptionStatus.SUSPENDED ? new Date() : null,
      },
      create: {
        schoolId,
        planId: plan.id,
        pricingId: pricing.id,
        status,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true, pricing: true },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'SUBSCRIPTION_ASSIGNED',
      module: 'BILLING',
      resourceId: subscription.id,
      metadata: { planId: plan.id, planName: plan.name, pricingId: pricing.id, status },
    });

    return subscription;
  }

  async getBillingMetrics() {
    return this.billingMetrics();
  }

  async getInvoices(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: PlatformInvoiceStatus;
  }) {
    const skip = Math.max(0, params.skip ?? 0);
    const take = Math.min(100, Math.max(1, params.take ?? 20));
    const where: Prisma.PlatformInvoiceWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
              { school: { name: { contains: params.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.platformInvoice.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: 'desc' },
        include: {
          school: { select: { id: true, name: true, code: true } },
          subscription: { include: { plan: { select: { id: true, name: true } } } },
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      }),
      this.prisma.platformInvoice.count({ where }),
    ]);

    return {
      items: items.map((invoice) => ({
        ...invoice,
        amountPaid: invoice.payments
          .filter((payment) => payment.status === PlatformPaymentStatus.SUCCESS)
          .reduce((sum, payment) => sum + this.number(payment.amount), 0),
      })),
      total,
      skip,
      take,
    };
  }

  async getPayments(params: {
    skip?: number;
    take?: number;
    search?: string;
    status?: PlatformPaymentStatus;
  }) {
    const skip = Math.max(0, params.skip ?? 0);
    const take = Math.min(100, Math.max(1, params.take ?? 20));
    const where: Prisma.PlatformPaymentWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { paymentReference: { contains: params.search, mode: 'insensitive' } },
              { externalReference: { contains: params.search, mode: 'insensitive' } },
              { provider: { contains: params.search, mode: 'insensitive' } },
              { school: { name: { contains: params.search, mode: 'insensitive' } } },
              { invoice: { invoiceNumber: { contains: params.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.platformPayment.findMany({
        where,
        skip,
        take,
        orderBy: { paymentDate: 'desc' },
        include: {
          school: { select: { id: true, name: true, code: true } },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
          subscription: { include: { plan: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.platformPayment.count({ where }),
    ]);

    return { items, total, skip, take };
  }

  async voidInvoice(invoiceId: string, actorId: string) {
    const invoice = await this.prisma.platformInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === PlatformInvoiceStatus.PAID) {
      throw new BadRequestException('Paid invoices cannot be voided');
    }

    const updated = await this.prisma.platformInvoice.update({
      where: { id: invoiceId },
      data: { status: PlatformInvoiceStatus.VOID },
    });
    await this.audit.log({
      userId: actorId,
      schoolId: invoice.schoolId,
      action: 'PLATFORM_INVOICE_VOIDED',
      module: 'BILLING',
      resourceId: invoiceId,
      metadata: { invoiceNumber: invoice.invoiceNumber, previousStatus: invoice.status },
    });
    return updated;
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      include: {
        pricing: { orderBy: { amount: 'asc' } },
        _count: { select: { subscriptions: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createPlan(dto: any, actorId: string) {
    const code = String(dto.code).trim().toUpperCase();
    const existing = await this.prisma.subscriptionPlan.findFirst({
      where: { OR: [{ code }, { name: dto.name }] },
    });
    if (existing) throw new BadRequestException('A plan with this name or code already exists');

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name.trim(),
        code,
        description: dto.description || null,
        status: dto.status || 'ACTIVE',
        trialDays: dto.trialDays ?? 0,
        displayOrder: dto.displayOrder ?? 0,
        features: dto.features || {},
        pricing: {
          create: (dto.pricing || []).map((pricing: any) => ({
            amount: pricing.amount,
            currency: pricing.currency || 'GHS',
            interval: pricing.interval,
            isActive: pricing.isActive ?? true,
          })),
        },
      },
      include: { pricing: true },
    });

    await this.audit.log({
      userId: actorId,
      action: 'PLAN_CREATED',
      module: 'BILLING',
      resourceId: plan.id,
      metadata: { code: plan.code, name: plan.name, pricingCount: plan.pricing.length },
    });
    return plan;
  }

  async updatePlan(planId: string, dto: any, actorId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    if (dto.code && dto.code.toUpperCase() !== plan.code) {
      const duplicate = await this.prisma.subscriptionPlan.findUnique({ where: { code: dto.code.toUpperCase() } });
      if (duplicate) throw new BadRequestException('Plan code is already in use');
    }
    if (dto.name && dto.name !== plan.name) {
      const duplicate = await this.prisma.subscriptionPlan.findUnique({ where: { name: dto.name } });
      if (duplicate) throw new BadRequestException('Plan name is already in use');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.subscriptionPlan.update({
        where: { id: planId },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.code ? { code: dto.code.toUpperCase() } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.trialDays !== undefined ? { trialDays: dto.trialDays } : {}),
          ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
          ...(dto.features !== undefined ? { features: dto.features } : {}),
        },
      });

      if (Array.isArray(dto.pricing)) {
        await tx.subscriptionPricing.updateMany({
          where: { planId },
          data: { isActive: false },
        });
        if (dto.pricing.length) {
          await tx.subscriptionPricing.createMany({
            data: dto.pricing.map((pricing: any) => ({
              planId,
              amount: pricing.amount,
              currency: pricing.currency || 'GHS',
              interval: pricing.interval,
              isActive: pricing.isActive ?? true,
            })),
          });
        }
      }

      await this.audit.log(
        {
          userId: actorId,
          action: 'PLAN_UPDATED',
          module: 'BILLING',
          resourceId: planId,
          metadata: { changedFields: Object.keys(dto) },
        },
        tx,
      );
      return result;
    });

    return this.prisma.subscriptionPlan.findUnique({
      where: { id: updated.id },
      include: { pricing: { orderBy: { amount: 'asc' } } },
    });
  }

  async archivePlan(planId: string, actorId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: {
                  in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE],
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan._count.subscriptions > 0) {
      throw new BadRequestException(
        `Plan has ${plan._count.subscriptions} active subscription(s). Move them to another plan before archiving.`,
      );
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id: planId },
      data: { status: 'ARCHIVED' },
    });
    await this.audit.log({
      userId: actorId,
      action: 'PLAN_ARCHIVED',
      module: 'BILLING',
      resourceId: planId,
      metadata: { code: plan.code, name: plan.name },
    });
    return updated;
  }

  async getAuditLogs(params: {
    skip?: number;
    take?: number;
    search?: string;
    action?: string;
    module?: string;
    schoolId?: string;
    from?: string;
    to?: string;
  }) {
    const skip = Math.max(0, params.skip ?? 0);
    const take = Math.min(200, Math.max(1, params.take ?? 50));
    const createdAt = this.dateRange(params.from, params.to);

    let searchUserIds: string[] = [];
    if (params.search) {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: params.search, mode: 'insensitive' } },
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 100,
      });
      searchUserIds = users.map((user) => user.id);
    }

    const where: Prisma.AuditLogWhereInput = {
      ...(params.action ? { action: params.action } : {}),
      ...(params.module ? { module: params.module } : {}),
      ...(params.schoolId ? { schoolId: params.schoolId } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(params.search
        ? {
            OR: [
              { action: { contains: params.search, mode: 'insensitive' } },
              { module: { contains: params.search, mode: 'insensitive' } },
              { resourceId: { contains: params.search, mode: 'insensitive' } },
              ...(searchUserIds.length ? [{ userId: { in: searchUserIds } }] : []),
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const userIds = [...new Set(items.map((item) => item.userId).filter(Boolean))] as string[];
    const schoolIds = [...new Set(items.map((item) => item.schoolId).filter(Boolean))] as string[];
    const [users, schools] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, email: true },
          })
        : [],
      schoolIds.length
        ? this.prisma.school.findMany({
            where: { id: { in: schoolIds } },
            select: { id: true, name: true, code: true },
          })
        : [],
    ]);
    const userMap = new Map<string, any>(users.map((user) => [user.id, user] as [string, any]));
    const schoolMap = new Map<string, any>(schools.map((school) => [school.id, school] as [string, any]));

    return {
      items: items.map((item) => ({
        ...item,
        actor: item.userId ? userMap.get(item.userId) || null : null,
        school: item.schoolId ? schoolMap.get(item.schoolId) || null : null,
      })),
      total,
      skip,
      take,
    };
  }

  async getAuditFilters() {
    const [actions, modules] = await Promise.all([
      this.prisma.auditLog.groupBy({ by: ['action'], _count: { _all: true }, orderBy: { action: 'asc' } }),
      this.prisma.auditLog.groupBy({ by: ['module'], _count: { _all: true }, orderBy: { module: 'asc' } }),
    ]);
    return {
      actions: actions.map((item) => ({ value: item.action, count: item._count._all })),
      modules: modules.map((item) => ({ value: item.module, count: item._count._all })),
    };
  }

  async getSecurityOverview() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [activeSessions, openIncidents, incidentGroups, highRiskEvents, mfaUsers, activeUsers, recentEvents] =
      await Promise.all([
        this.prisma.userSession.count({
          where: { status: SessionStatus.ACTIVE, expiresAt: { gt: now } },
        }),
        this.prisma.securityIncident.count({
          where: { status: { in: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING] } },
        }),
        this.prisma.securityIncident.groupBy({
          by: ['severity'],
          where: { status: { in: [IncidentStatus.OPEN, IncidentStatus.INVESTIGATING] } },
          _count: { _all: true },
        }),
        this.prisma.securityEvent.count({
          where: {
            createdAt: { gte: dayAgo },
            severity: { in: [SecuritySeverity.HIGH, SecuritySeverity.CRITICAL] },
          },
        }),
        this.prisma.mfaMethod.findMany({
          where: { verifiedAt: { not: null } },
          distinct: ['userId'],
          select: { userId: true },
        }),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.securityEvent.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        }),
      ]);

    const incidentCounts = Object.fromEntries(
      incidentGroups.map((group) => [group.severity, group._count._all]),
    ) as Record<string, number>;
    const mfaAdoption = activeUsers ? Math.round((mfaUsers.length / activeUsers) * 100) : 0;
    const criticalIncidents = incidentCounts.CRITICAL || 0;
    const highIncidents = incidentCounts.HIGH || 0;

    return {
      activeSessions,
      openIncidents,
      criticalIncidents,
      highIncidents,
      incidentCounts,
      highRiskEvents24h: highRiskEvents,
      mfaAdoption,
      mfaUsers: mfaUsers.length,
      activeUsers,
      riskStatus: criticalIncidents > 0 ? 'CRITICAL' : highIncidents > 0 ? 'ELEVATED' : highRiskEvents > 10 ? 'GUARDED' : 'HEALTHY',
      recentEvents,
      generatedAt: now.toISOString(),
    };
  }

  async getSecurityIncidents(params: {
    skip?: number;
    take?: number;
    status?: IncidentStatus;
    severity?: SecuritySeverity;
    search?: string;
  }) {
    const skip = Math.max(0, params.skip ?? 0);
    const take = Math.min(100, Math.max(1, params.take ?? 20));
    const where: Prisma.SecurityIncidentWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.severity ? { severity: params.severity } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.securityIncident.findMany({
        where,
        skip,
        take,
        orderBy: { detectedAt: 'desc' },
        include: { school: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.securityIncident.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async updateSecurityIncident(incidentId: string, dto: { status: string; note?: string }, actorId: string) {
    const incident = await this.prisma.securityIncident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException('Security incident not found');
    const status = dto.status as IncidentStatus;
    const updated = await this.prisma.securityIncident.update({
      where: { id: incidentId },
      data: {
        status,
        resolvedAt: status === IncidentStatus.RESOLVED || status === IncidentStatus.CLOSED ? new Date() : null,
      },
    });
    await this.audit.log({
      userId: actorId,
      schoolId: incident.schoolId || undefined,
      action: 'SECURITY_INCIDENT_UPDATED',
      module: 'SECURITY',
      resourceId: incidentId,
      metadata: { previousStatus: incident.status, newStatus: status, note: dto.note || null },
    });
    return updated;
  }

  async getSecurityEvents(params: {
    skip?: number;
    take?: number;
    severity?: SecuritySeverity;
    eventType?: string;
    search?: string;
  }) {
    const skip = Math.max(0, params.skip ?? 0);
    const take = Math.min(200, Math.max(1, params.take ?? 50));
    let searchUserIds: string[] = [];
    if (params.search) {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: params.search, mode: 'insensitive' } },
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 100,
      });
      searchUserIds = users.map((user) => user.id);
    }
    const where: Prisma.SecurityEventWhereInput = {
      ...(params.severity ? { severity: params.severity } : {}),
      ...(params.eventType ? { eventType: params.eventType as any } : {}),
      ...(params.search
        ? {
            OR: [
              { ipAddress: { contains: params.search, mode: 'insensitive' } },
              ...(searchUserIds.length ? [{ userId: { in: searchUserIds } }] : []),
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          school: { select: { id: true, name: true } },
        },
      }),
      this.prisma.securityEvent.count({ where }),
    ]);
    return { items, total, skip, take };
  }

  async getSecurityPolicy() {
    const policy = await this.prisma.securityPolicy.findFirst({ where: { schoolId: null } });
    return (
      policy || {
        id: null,
        schoolId: null,
        passwordMinLength: 8,
        passwordRequireUpper: true,
        passwordRequireNumber: true,
        passwordRequireSymbol: true,
        mfaEnforcement: 'OPTIONAL',
        sessionTimeoutMinutes: 60,
        idleTimeoutMinutes: 15,
        maxConcurrentSessions: 5,
        lockoutThreshold: 5,
        lockoutDurationMinutes: 30,
      }
    );
  }

  async updateSecurityPolicy(dto: any, actorId: string) {
    const existing = await this.prisma.securityPolicy.findFirst({ where: { schoolId: null } });
    const data = { ...dto };
    if (data.mfaEnforcement) data.mfaEnforcement = data.mfaEnforcement as any;
    const policy = existing
      ? await this.prisma.securityPolicy.update({ where: { id: existing.id }, data })
      : await this.prisma.securityPolicy.create({ data: { ...data, schoolId: null } });

    await this.audit.log({
      userId: actorId,
      action: 'PLATFORM_SECURITY_POLICY_UPDATED',
      module: 'SECURITY',
      resourceId: policy.id,
      metadata: { changedFields: Object.keys(dto) },
    });
    return policy;
  }

  async getMaintenanceWindows() {
    return this.prisma.maintenanceWindow.findMany({
      include: {
        schools: { select: { id: true, name: true, code: true, status: true } },
      },
      orderBy: { startAt: 'desc' },
    });
  }

  async createMaintenanceWindow(dto: any, actorId: string) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Valid start and end dates are required');
    }
    if (endAt <= startAt) throw new BadRequestException('End time must be after start time');
    const allSchools = dto.allSchools ?? true;
    if (!allSchools && !dto.schoolIds?.length) {
      throw new BadRequestException('Select at least one school or target all schools');
    }

    const window = await this.prisma.maintenanceWindow.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        affectedServices: dto.affectedServices,
        startAt,
        endAt,
        priority: dto.priority || NotificationPriority.NORMAL,
        allSchools,
        createdBy: actorId,
        schools: allSchools ? undefined : { connect: dto.schoolIds.map((id: string) => ({ id })) },
      },
      include: { schools: { select: { id: true, name: true, code: true, status: true } } },
    });

    await this.audit.log({
      userId: actorId,
      action: 'MAINTENANCE_SCHEDULED',
      module: 'SYSTEM',
      resourceId: window.id,
      metadata: {
        title: window.title,
        startAt,
        endAt,
        allSchools,
        schoolCount: window.schools.length,
      },
    });
    return window;
  }

  async updateMaintenanceWindow(windowId: string, dto: any, actorId: string) {
    const existing = await this.prisma.maintenanceWindow.findUnique({ where: { id: windowId } });
    if (!existing) throw new NotFoundException('Maintenance window not found');

    const startAt = dto.startAt ? new Date(dto.startAt) : existing.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : existing.endAt;
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Valid start and end dates are required');
    }
    if (endAt <= startAt) throw new BadRequestException('End time must be after start time');

    const allSchools = dto.allSchools ?? existing.allSchools;
    if (!allSchools && dto.schoolIds && dto.schoolIds.length === 0) {
      throw new BadRequestException('Select at least one school or target all schools');
    }

    const updated = await this.prisma.maintenanceWindow.update({
      where: { id: windowId },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.affectedServices ? { affectedServices: dto.affectedServices } : {}),
        ...(dto.startAt ? { startAt } : {}),
        ...(dto.endAt ? { endAt } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        allSchools,
        ...(dto.schoolIds
          ? { schools: { set: dto.schoolIds.map((id: string) => ({ id })) } }
          : allSchools
            ? { schools: { set: [] } }
            : {}),
      },
      include: { schools: { select: { id: true, name: true, code: true, status: true } } },
    });

    await this.audit.log({
      userId: actorId,
      action: dto.status ? 'MAINTENANCE_STATUS_UPDATED' : 'MAINTENANCE_UPDATED',
      module: 'SYSTEM',
      resourceId: windowId,
      metadata: { changedFields: Object.keys(dto), status: updated.status },
    });
    return updated;
  }

  async getMaintenanceStatus(schoolId?: string) {
    const now = new Date();
    await this.prisma.maintenanceWindow.updateMany({
      where: {
        status: MaintenanceStatus.ACTIVE,
        endAt: { lte: now },
      },
      data: {
        status: MaintenanceStatus.COMPLETED,
        endedAt: now,
      },
    });

    const audience = schoolId
      ? {
          OR: [
            { allSchools: true },
            { schools: { some: { id: schoolId } } },
          ],
        }
      : { allSchools: true };

    const [active, upcoming] = await Promise.all([
      this.prisma.maintenanceWindow.findMany({
        where: {
          ...audience,
          status: MaintenanceStatus.ACTIVE,
          startAt: { lte: now },
          endAt: { gt: now },
        },
        include: {
          schools: { select: { id: true, name: true, code: true } },
        },
        orderBy: { startAt: 'asc' },
      }),
      this.prisma.maintenanceWindow.findMany({
        where: {
          ...audience,
          status: MaintenanceStatus.SCHEDULED,
          endAt: { gt: now },
        },
        include: {
          schools: { select: { id: true, name: true, code: true } },
        },
        orderBy: { startAt: 'asc' },
        take: 10,
      }),
    ]);

    return {
      serverTime: now,
      active,
      upcoming,
      isInMaintenance: active.length > 0,
    };
  }

  async startMaintenanceWindow(windowId: string, actorId: string) {
    const window = await this.prisma.maintenanceWindow.findUnique({
      where: { id: windowId },
    });
    if (!window) throw new NotFoundException('Maintenance window not found');
    if (window.status !== MaintenanceStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled maintenance can be started.');
    }

    const now = new Date();
    const updated = await this.prisma.maintenanceWindow.update({
      where: { id: windowId },
      data: {
        status: MaintenanceStatus.ACTIVE,
        startedAt: now,
        endedAt: null,
        cancelledAt: null,
        startAt: window.startAt > now ? now : window.startAt,
        endAt: window.endAt <= now ? new Date(now.getTime() + 60 * 60 * 1000) : window.endAt,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'MAINTENANCE_STARTED',
      module: 'SYSTEM',
      resourceId: windowId,
      metadata: { title: window.title, startedAt: now },
    });

    return updated;
  }

  async endMaintenanceWindow(windowId: string, actorId: string) {
    const window = await this.prisma.maintenanceWindow.findUnique({
      where: { id: windowId },
    });
    if (!window) throw new NotFoundException('Maintenance window not found');
    if (window.status !== MaintenanceStatus.ACTIVE) {
      throw new BadRequestException('Only active maintenance can be ended.');
    }

    const now = new Date();
    const updated = await this.prisma.maintenanceWindow.update({
      where: { id: windowId },
      data: {
        status: MaintenanceStatus.COMPLETED,
        endedAt: now,
        endAt: now,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'MAINTENANCE_ENDED',
      module: 'SYSTEM',
      resourceId: windowId,
      metadata: { title: window.title, endedAt: now },
    });

    return updated;
  }

  async cancelMaintenanceWindow(windowId: string, actorId: string, reason?: string) {
    const window = await this.prisma.maintenanceWindow.findUnique({
      where: { id: windowId },
    });
    if (!window) throw new NotFoundException('Maintenance window not found');
    if (
      window.status !== MaintenanceStatus.SCHEDULED &&
      window.status !== MaintenanceStatus.ACTIVE
    ) {
      throw new BadRequestException('This maintenance window cannot be cancelled.');
    }

    const now = new Date();
    const updated = await this.prisma.maintenanceWindow.update({
      where: { id: windowId },
      data: {
        status: MaintenanceStatus.CANCELLED,
        cancelledAt: now,
        endedAt: now,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'MAINTENANCE_CANCELLED',
      module: 'SYSTEM',
      resourceId: windowId,
      metadata: { title: window.title, reason: reason || null, cancelledAt: now },
    });

    return updated;
  }

  async broadcastMaintenance(windowId: string, actorId: string) {
    const window = await this.prisma.maintenanceWindow.findUnique({
      where: { id: windowId },
      include: { schools: { select: { id: true, name: true } } },
    });
    if (!window) throw new NotFoundException('Maintenance window not found');

    const schools = window.allSchools
      ? await this.prisma.school.findMany({
          where: { status: { in: [SchoolStatus.ACTIVE, SchoolStatus.TRIAL] } },
          select: { id: true, name: true },
        })
      : window.schools;

    const admins = schools.length
      ? await this.prisma.userRole.findMany({
          where: {
            schoolId: { in: schools.map((school) => school.id) },
            role: { name: 'SCHOOL_ADMIN' },
          },
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
            school: { select: { id: true, name: true } },
          },
        })
      : [];

    const recipients = new Map<string, { email: string; name: string; schoolName: string }>();
    for (const admin of admins) {
      if (!admin.user.isActive || !admin.user.email || !admin.school) continue;
      recipients.set(`${admin.school.id}:${admin.user.id}`, {
        email: admin.user.email,
        name: `${admin.user.firstName} ${admin.user.lastName}`.trim(),
        schoolName: admin.school.name,
      });
    }

    let sent = 0;
    let failed = 0;
    for (const recipient of recipients.values()) {
      const result = await this.emailProvider.send({
        to: recipient.email,
        subject: `[SchooMA] ${window.priority} maintenance: ${window.title}`,
        body: `Hello ${recipient.name},\n\nA ${window.priority.toLowerCase()} priority maintenance window has been scheduled for ${recipient.schoolName}.\n\n${window.title}\n${window.description || ''}\n\nStart: ${window.startAt.toLocaleString()}\nEnd: ${window.endAt.toLocaleString()}\nAffected services: ${window.affectedServices.join(', ')}\n\nWe apologize for any inconvenience.`,
      });
      if (result.success) sent += 1;
      else failed += 1;
    }

    await this.audit.log({
      userId: actorId,
      action: 'MAINTENANCE_BROADCAST',
      module: 'SYSTEM',
      resourceId: windowId,
      metadata: { recipients: recipients.size, sent, failed, schoolCount: schools.length },
    });

    return {
      recipients: recipients.size,
      sent,
      failed,
      schools: schools.length,
      message: recipients.size
        ? `Broadcast attempted for ${recipients.size} school administrator(s).`
        : 'No active school administrators were found for the selected schools.',
    };
  }

  async getPlatformAnnouncements() {
    const items = await this.prisma.announcement.findMany({
      where: { schoolId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { notifications: true } },
      },
      take: 50,
    });
    return items;
  }

  async createPlatformAnnouncement(dto: any, actorId: string) {
    const publishImmediately = dto.publishImmediately ?? false;
    const publishAt = dto.publishAt ? new Date(dto.publishAt) : publishImmediately ? new Date() : null;
    if (publishAt && Number.isNaN(publishAt.getTime())) throw new BadRequestException('Invalid publish date');
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new BadRequestException('Invalid expiry date');
    if (expiresAt && publishAt && expiresAt <= publishAt) {
      throw new BadRequestException('Expiry date must be after the publish date');
    }

    const announcement = await this.prisma.announcement.create({
      data: {
        schoolId: null,
        authorId: actorId,
        title: dto.title,
        content: dto.content,
        priority: dto.priority || NotificationPriority.NORMAL,
        status: publishImmediately ? AnnouncementStatus.PUBLISHED : AnnouncementStatus.DRAFT,
        publishAt,
        expiresAt,
        audiences: { create: [{ audienceType: 'ALL' }] },
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    const delivery = publishImmediately
      ? await this.deliverAnnouncement(announcement, dto)
      : null;

    await this.audit.log({
      userId: actorId,
      action: publishImmediately ? 'PLATFORM_ANNOUNCEMENT_PUBLISHED' : 'PLATFORM_ANNOUNCEMENT_CREATED',
      module: 'COMMUNICATION',
      resourceId: announcement.id,
      metadata: {
        title: announcement.title,
        allSchools: dto.allSchools ?? true,
        schoolIds: dto.schoolIds || [],
        delivery,
      },
    });

    return { ...announcement, delivery };
  }

  async publishPlatformAnnouncement(announcementId: string, dto: any, actorId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, schoolId: null },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!announcement) throw new NotFoundException('Platform announcement not found');
    if (announcement.status === AnnouncementStatus.CANCELLED) {
      throw new BadRequestException('Cancelled announcements cannot be published');
    }

    const notificationCount = await this.prisma.notification.count({
      where: { announcementId },
    });
    if (notificationCount > 0) {
      return { ...announcement, delivery: { recipients: notificationCount, alreadyDelivered: true } };
    }

    const updated = await this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        status: AnnouncementStatus.PUBLISHED,
        publishAt: announcement.publishAt || new Date(),
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    const delivery = await this.deliverAnnouncement(updated, dto);

    await this.audit.log({
      userId: actorId,
      action: 'PLATFORM_ANNOUNCEMENT_PUBLISHED',
      module: 'COMMUNICATION',
      resourceId: announcementId,
      metadata: { title: updated.title, delivery },
    });

    return { ...updated, delivery };
  }

  private async deliverAnnouncement(announcement: any, options: any) {
    const schools = options.allSchools === false && options.schoolIds?.length
      ? await this.prisma.school.findMany({
          where: { id: { in: options.schoolIds } },
          select: { id: true, name: true },
        })
      : await this.prisma.school.findMany({
          where: { status: { in: [SchoolStatus.ACTIVE, SchoolStatus.TRIAL] } },
          select: { id: true, name: true },
        });

    if (!schools.length) return { recipients: 0, sent: 0, failed: 0, schools: 0 };

    const admins = await this.prisma.userRole.findMany({
      where: {
        schoolId: { in: schools.map((school) => school.id) },
        role: { name: 'SCHOOL_ADMIN' },
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
        school: { select: { id: true, name: true } },
      },
      take: 250,
    });

    const uniqueRecipients = new Map<string, any>();
    for (const admin of admins) {
      if (!admin.user.isActive || !admin.school) continue;
      uniqueRecipients.set(`${admin.school.id}:${admin.user.id}`, admin);
    }

    let sent = 0;
    let failed = 0;
    for (const admin of uniqueRecipients.values()) {
      let emailDelivery: { status: DeliveryStatus; providerRef?: string; error?: string } | null = null;
      if (options.sendEmail && admin.user.email) {
        const result = await this.emailProvider.send({
          to: admin.user.email,
          subject: `[SchooMA] ${announcement.title}`,
          body: `Hello ${admin.user.firstName || 'Administrator'},\n\n${announcement.content}\n\nThis is a platform-wide announcement from SchooMA.`,
        });
        emailDelivery = result.success
          ? { status: DeliveryStatus.DELIVERED, providerRef: result.reference }
          : { status: DeliveryStatus.FAILED, error: result.error };
        if (result.success) sent += 1;
        else failed += 1;
      }

      await this.prisma.notification.create({
        data: {
          schoolId: admin.school.id,
          userId: admin.user.id,
          notificationType: 'PLATFORM_ANNOUNCEMENT',
          announcementId: announcement.id,
          title: announcement.title,
          content: announcement.content,
          priority: announcement.priority,
          status: NotificationStatus.SENT,
          deliveries: {
            create: [
              {
                channel: CommunicationChannel.IN_APP,
                status: DeliveryStatus.DELIVERED,
                deliveredAt: new Date(),
                attemptCount: 1,
                lastAttemptAt: new Date(),
              },
              ...(emailDelivery
                ? [
                    {
                      channel: CommunicationChannel.EMAIL,
                      provider: 'SMTP',
                      status: emailDelivery.status,
                      providerRef: emailDelivery.providerRef,
                      errorMessage: emailDelivery.error,
                      attemptCount: 1,
                      lastAttemptAt: new Date(),
                      deliveredAt: emailDelivery.status === DeliveryStatus.DELIVERED ? new Date() : null,
                      failedAt: emailDelivery.status === DeliveryStatus.FAILED ? new Date() : null,
                    },
                  ]
                : []),
            ],
          },
        },
      });
    }

    return {
      recipients: uniqueRecipients.size,
      sent,
      failed,
      schools: schools.length,
      emailRequested: Boolean(options.sendEmail),
    };
  }

  /* ============================================================
     SMS Credit Management
     Platform Super Admin manages SMS token balances per school
     ============================================================ */

  async getSmsCredits() {
    const schools = await this.prisma.school.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        currency: true,
        smsCreditBalance: true,
      },
      orderBy: [{ smsCreditBalance: 'asc' }, { name: 'asc' }],
    });

    return schools.map((school) => ({
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.code,
      status: school.status,
      currency: school.currency,
      smsCreditBalance: Number(school.smsCreditBalance),
    }));
  }

  async getSmsCreditDetail(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        currency: true,
        smsCreditBalance: true,
      },
    });
    if (!school) throw new NotFoundException('School not found');

    // Get recent SMS usage
    const recentUsage = await this.prisma.communicationUsage.findMany({
      where: { schoolId, channel: 'SMS' },
      orderBy: { billingPeriodStart: 'desc' },
      take: 12,
    });

    return {
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.code,
      status: school.status,
      currency: school.currency,
      smsCreditBalance: Number(school.smsCreditBalance),
      recentUsage: recentUsage.map((u) => ({
        periodStart: u.billingPeriodStart,
        periodEnd: u.billingPeriodEnd,
        successfulCount: u.successfulCount,
        failedCount: u.failedCount,
      })),
    };
  }

  /**
   * Platform credit grant. Delegated to SmsService, which owns the credit
   * ledger, so there is exactly one implementation that writes balances and
   * `SmsCreditPurchase` rows. Super Admin keeps control of who may call it via
   * the PLATFORM_SUPER_ROLES guard on the route.
   */
  async topUpSmsCredit(dto: GrantSmsCreditsDto, actorId: string) {
    return this.sms.grantSmsCredits(dto.schoolId, dto.packageId, dto.reason, actorId);
  }

  async getSmsPurchaseLedger(params: { status?: string; schoolId?: string; take?: number }) {
    return this.sms.getSmsPurchaseLedger(params);
  }

  async getOperationsData() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      securityEvents,
      failedDeliveries,
      recentAuditLogs,
      pendingSchools,
      expiringSubscriptions,
      lowSmsCreditSchools,
    ] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where: { createdAt: { gte: dayAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          school: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.notificationDelivery.findMany({
        where: {
          status: 'FAILED',
          failedAt: { gte: dayAgo },
        },
        orderBy: { failedAt: 'desc' },
        take: 20,
        include: {
          notification: {
            select: { id: true, title: true, schoolId: true, createdAt: true },
          },
        },
      }),
      this.prisma.auditLog.findMany({
        where: { createdAt: { gte: dayAgo } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.school.count({
        where: { status: SchoolStatus.PENDING },
      }),
      this.prisma.schoolSubscription.count({
        where: {
          status: SubscriptionStatus.TRIALING,
          trialEnd: { lt: now },
        },
      }),
      this.prisma.school.findMany({
        where: {
          smsCreditBalance: { lt: 10 },
          status: SchoolStatus.ACTIVE,
        },
        select: { id: true, name: true, code: true, smsCreditBalance: true },
        take: 20,
        orderBy: { smsCreditBalance: 'asc' },
      }),
    ]);

    // AuditLog has no Prisma relations to User/School, so enrich ids separately.
    const auditUserIds = Array.from(
      new Set(recentAuditLogs.map((log) => log.userId).filter((id): id is string => Boolean(id))),
    );
    const auditSchoolIds = Array.from(
      new Set(recentAuditLogs.map((log) => log.schoolId).filter((id): id is string => Boolean(id))),
    );
    const [auditUsers, auditSchools] = await Promise.all([
      auditUserIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: auditUserIds } },
            select: { id: true, firstName: true, lastName: true },
          })
        : [],
      auditSchoolIds.length
        ? this.prisma.school.findMany({
            where: { id: { in: auditSchoolIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);
    const auditUserMap = new Map<string, { firstName: string; lastName: string }>(
      auditUsers.map((u) => [u.id, u] as [string, { firstName: string; lastName: string }]),
    );
    const auditSchoolMap = new Map<string, { name: string }>(
      auditSchools.map((s) => [s.id, s] as [string, { name: string }]),
    );

    const alerts = [
      ...securityEvents.map((event: any) => ({
        id: event.id,
        type: 'security' as const,
        severity: event.severity || 'medium',
        title: event.title || 'Security Event',
        description: event.description || '',
        user: event.user ? `${event.user.firstName} ${event.user.lastName}` : 'System',
        school: event.school ? event.school.name : 'Platform',
        time: event.createdAt,
      })),
      ...failedDeliveries.map((d: any) => ({
        id: d.id,
        type: 'delivery' as const,
        severity: 'high' as const,
        title: 'Failed Message Delivery',
        description: d.errorMessage || 'Message failed to send',
        user: d.notification ? 'System' : 'Unknown',
        school: d.notification?.schoolId ? 'School' : 'Platform',
        time: d.failedAt,
      })),
      ...(pendingSchools > 0 ? [{
        id: 'pending-schools',
        type: 'approval' as const,
        severity: 'medium' as const,
        title: 'Pending School Registrations',
        description: `${pendingSchools} school(s) awaiting approval`,
        user: 'System',
        school: 'Platform',
        time: now,
      }] : []),
      ...(expiringSubscriptions > 0 ? [{
        id: 'expiring-subscriptions',
        type: 'billing' as const,
        severity: 'medium' as const,
        title: 'Trial Subscriptions Expiring',
        description: `${expiringSubscriptions} trial subscription(s) expiring soon`,
        user: 'System',
        school: 'Platform',
        time: now,
      }] : []),
      ...(lowSmsCreditSchools.length > 0 ? [{
        id: 'low-sms-credits',
        type: 'billing' as const,
        severity: 'high' as const,
        title: 'Low SMS Credit Balances',
        description: `${lowSmsCreditSchools.length} school(s) have SMS credits below 10`,
        user: 'System',
        school: 'Platform',
        time: now,
      }] : []),
    ].sort((a: any, b: any) =>
      new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    return {
      alerts,
      alertCount: alerts.length,
      criticalCount: alerts.filter((a: any) => a.severity === 'critical').length,
      highCount: alerts.filter((a: any) => a.severity === 'high').length,
      mediumCount: alerts.filter((a: any) => a.severity === 'medium').length,
      lowCount: alerts.filter((a: any) => a.severity === 'low').length,
      recentActivity: recentAuditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        module: log.module,
        user: log.userId
          ? `${(auditUserMap.get(log.userId)?.firstName ?? '')} ${(auditUserMap.get(log.userId)?.lastName ?? '')}`.trim() ||
            'Unknown user'
          : 'System',
        school: log.schoolId ? auditSchoolMap.get(log.schoolId)?.name || 'Platform' : 'Platform',
        time: log.createdAt,
      })),
      pendingApprovals: pendingSchools,
      expiringTrials: expiringSubscriptions,
      lowSmsCreditSchools,
      generatedAt: now.toISOString(),
    };
  }
}
