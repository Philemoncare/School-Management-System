import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from './billing.service';
import {
  SubscriptionStatus,
  SubscriptionInvoiceStatus,
  CreditSource,
  BillingInterval,
  Prisma
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private billing: BillingService,
  ) {}

  // --- 1. CORE POLICIES ---

  /**
   * UPGRADE POLICY: Immediate effect. Prorated charge/credit.
   */
  async upgrade(schoolId: string, newPricingId: string, actorId: string) {
    const currentSub = await this.getSchoolSubscription(schoolId);
    const newPricing = await this.prisma.subscriptionPricing.findUnique({
      where: { id: newPricingId },
      include: { plan: true },
    });

    if (!newPricing || !newPricing.isActive) throw new NotFoundException('New plan pricing not found');
    if (newPricing.currency !== currentSub.pricing.currency) {
      throw new BadRequestException('Currency mismatch. We do not support cross-currency upgrades.');
    }

    const now = new Date();
    const proration = this.billing.calculateProration(
      currentSub.pricing.amount,
      newPricing.amount,
      currentSub.currentPeriodStart,
      currentSub.currentPeriodEnd,
      now
    );

    return this.prisma.$transaction(async (tx) => {
      // Create Audit Snapshot
      const auditMetadata = {
        previousPlan: currentSub.plan.code,
        newPlan: newPricing.plan.code,
        previousPrice: currentSub.pricing.amount,
        newPrice: newPricing.amount,
        prorationCredit: proration.credit,
        prorationCharge: proration.charge,
        netAmount: proration.net,
        remainingDays: proration.remainingDays,
      };

      // Handle Financials
      if (proration.net.gt(0)) {
        // Net Charge: Create immediate invoice
        await this.createPlatformInvoice(tx, schoolId, currentSub.id, proration.net, newPricing.currency, `Upgrade to ${newPricing.plan.name}`);
      } else if (proration.net.lt(0)) {
        // Net Credit: Store as subscription credit
        await tx.subscriptionCredit.create({
          data: {
            schoolId,
            subscriptionId: currentSub.id,
            amount: proration.net.abs(),
            currency: newPricing.currency,
            source: CreditSource.PRORATION,
            remainingAmount: proration.net.abs(),
            reason: `Proration credit from ${currentSub.plan.name} to ${newPricing.plan.name}`,
          },
        });
      }

      // Update Subscription
      const updated = await tx.schoolSubscription.update({
        where: { id: currentSub.id },
        data: {
          planId: newPricing.planId,
          pricingId: newPricing.id,
          // Period remains the same for upgrades; we just changed the service level
        },
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'SUBSCRIPTION_UPGRADED',
        module: 'SUBSCRIPTIONS',
        resourceId: currentSub.id,
        metadata: auditMetadata,
      });

      return updated;
    });
  }

  /**
   * DOWNGRADE POLICY: Delayed effect (End of period).
   */
  async downgrade(schoolId: string, newPricingId: string, actorId: string) {
    const currentSub = await this.getSchoolSubscription(schoolId);
    const newPricing = await this.prisma.subscriptionPricing.findUnique({
      where: { id: newPricingId },
      include: { plan: true },
    });

    if (!newPricing) throw new NotFoundException('Target plan pricing not found');

    const updated = await this.prisma.schoolSubscription.update({
      where: { id: currentSub.id },
      data: {
        scheduledPlanId: newPricing.planId,
        scheduledPricingId: newPricing.id,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'SUBSCRIPTION_DOWNGRADE_SCHEDULED',
      module: 'SUBSCRIPTIONS',
      resourceId: currentSub.id,
      metadata: {
        newPlan: newPricing.plan.code,
        effectiveDate: currentSub.currentPeriodEnd
      },
    });

    return updated;
  }

  /**
   * CANCELLATION POLICY: Supported Immediate or Period End.
   */
  async cancel(schoolId: string, mode: 'IMMEDIATE' | 'PERIOD_END', reason: string, actorId: string) {
    const sub = await this.getSchoolSubscription(schoolId);

    const data: Prisma.SchoolSubscriptionUpdateInput = {
      cancellationReason: reason,
      cancelledAt: new Date(),
      autoRenew: false,
    };

    if (mode === 'IMMEDIATE') {
      data.status = SubscriptionStatus.CANCELLED;
      data.endedAt = new Date();
    }

    const updated = await this.prisma.schoolSubscription.update({
      where: { id: sub.id },
      data,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: `SUBSCRIPTION_CANCEL_${mode}`,
      module: 'SUBSCRIPTIONS',
      resourceId: sub.id,
      metadata: { reason },
    });

    return updated;
  }

  // --- 2. RENEWAL & EXPIRY (Background Tasks) ---

  async processRenewals() {
    const now = new Date();
    // Find active subscriptions that have ended
    const expiring = await this.prisma.schoolSubscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { lte: now },
        autoRenew: true,
      },
      include: { pricing: true },
    });

    for (const sub of expiring) {
      await this.renewSubscription(sub);
    }
  }

  private async renewSubscription(sub: any) {
    return this.prisma.$transaction(async (tx) => {
      const pricing = sub.pricing;
      const nextPeriodStart = sub.currentPeriodEnd;
      const nextPeriodEnd = this.billing.calculateNextBillingDate(nextPeriodStart, pricing.interval);

      // 1. Create Invoice
      const invoice = await this.createPlatformInvoice(tx, sub.schoolId, sub.id, pricing.amount, pricing.currency, `Renewal: ${pricing.interval}`);

      // 2. Apply any available credits
      await this.applyCreditsToInvoice(tx, sub.schoolId, invoice.id);

      // 3. Update subscription period
      await tx.schoolSubscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodStart: nextPeriodStart,
          currentPeriodEnd: nextPeriodEnd,
          // Handle scheduled downgrades if any
          ...(sub.scheduledPricingId ? {
            planId: sub.scheduledPlanId,
            pricingId: sub.scheduledPricingId,
            scheduledPlanId: null,
            scheduledPricingId: null,
          } : {}),
        },
      });

      // Note: Actual payment processing would be triggered here or via webhook later
    });
  }

  // --- 3. FINANCIAL HELPERS ---

  private async applyCreditsToInvoice(tx: Prisma.TransactionClient, schoolId: string, invoiceId: string) {
    const invoice = await tx.subscriptionInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    const credits = await tx.subscriptionCredit.findMany({
      where: { schoolId, currency: invoice.currency, remainingAmount: { gt: 0 } },
      orderBy: { createdAt: 'asc' }, // Oldest first
    });

    let remainingInvoiceBalance = invoice.total;

    for (const credit of credits) {
      if (remainingInvoiceBalance.lte(0)) break;

      const amountToApply = Decimal.min(remainingInvoiceBalance, credit.remainingAmount);

      // Update credit
      await tx.subscriptionCredit.update({
        where: { id: credit.id },
        data: { remainingAmount: { decrement: amountToApply } },
      });

      remainingInvoiceBalance = remainingInvoiceBalance.minus(amountToApply);
    }

    if (remainingInvoiceBalance.lt(invoice.total)) {
      // Update invoice if any credit was applied
      await tx.subscriptionInvoice.update({
        where: { id: invoiceId },
        data: {
          status: remainingInvoiceBalance.lte(0) ? SubscriptionInvoiceStatus.PAID : SubscriptionInvoiceStatus.ISSUED,
          // we could store the 'amountPaid' if we added it to schema
        },
      });
    }
  }

  private async createPlatformInvoice(
    tx: Prisma.TransactionClient,
    schoolId: string,
    subId: string,
    amount: Decimal,
    currency: string,
    description: string
  ) {
    const invoiceNumber = `PLAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    return tx.subscriptionInvoice.create({
      data: {
        schoolId,
        subscriptionId: subId,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal: amount,
        total: amount,
        currency,
        status: SubscriptionInvoiceStatus.ISSUED,
      },
    });
  }

  // --- 4. DATA ACCESS ---

  async getSchoolSubscription(schoolId: string) {
    const sub = await this.prisma.schoolSubscription.findUnique({
      where: { schoolId },
      include: { plan: true, pricing: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return sub;
  }

  async findAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { status: 'ACTIVE' },
      include: {
        pricing: { where: { isActive: true } }
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getUsage(schoolId: string) {
    const [students, teachers, staff] = await Promise.all([
      this.prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.teacher.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.staff.count({ where: { schoolId, status: 'ACTIVE' } }),
    ]);

    return {
      students,
      teachers,
      staff,
    };
  }

  async subscribe(schoolId: string, planId: string, actorId: string) {
    // Basic implementation for subscribing a school to a plan
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { pricing: { where: { isActive: true }, take: 1 } }
    });

    if (!plan || plan.pricing.length === 0) throw new NotFoundException('Plan or pricing not found');

    const pricing = plan.pricing[0];
    const startDate = new Date();
    const endDate = this.billing.calculateNextBillingDate(startDate, pricing.interval);

    const subscription = await this.prisma.schoolSubscription.upsert({
      where: { schoolId },
      update: {
        planId: plan.id,
        pricingId: pricing.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      },
      create: {
        schoolId,
        planId: plan.id,
        pricingId: pricing.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      }
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'SUBSCRIPTION_CREATED',
      module: 'SUBSCRIPTIONS',
      resourceId: subscription.id,
    });

    return subscription;
  }

  // --- 5. SUPER ADMIN METHODS ---

  async createPlan(dto: CreatePlanDto, actorId: string) {
    const { pricing, ...data } = dto;
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        ...data,
        pricing: {
          create: pricing
        }
      },
      include: { pricing: true }
    });

    await this.audit.log({
      userId: actorId,
      action: 'PLAN_CREATED',
      module: 'SUBSCRIPTIONS',
      resourceId: plan.id,
      metadata: { planCode: plan.code }
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto, actorId: string) {
    const { pricing, ...data } = dto;

    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...data,
        ...(pricing ? {
          pricing: {
            upsert: pricing.map((p: any) => ({
              where: { id: p.id || 'new-pricing' },
              update: p,
              create: p,
            })),
          },
        } : {}),
      },
      include: { pricing: true }
    });

    await this.audit.log({
      userId: actorId,
      action: 'PLAN_UPDATED',
      module: 'SUBSCRIPTIONS',
      resourceId: plan.id,
    });

    return plan;
  }
}
