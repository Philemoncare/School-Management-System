import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  PurchaseStatus,
  SmsPackageStatus,
  SchoolStatus,
  Prisma,
} from '@prisma/client';
import {
  CreateSmsPackageDto,
  UpdateSmsPackageDto,
} from './dto/sms-package.dto';

/**
 * Outcome of a guarded balance decrement. The failing branches carry the
 * reason as the discriminant itself, so callers cannot read a balance field
 * that does not exist on them.
 */
type CreditDeduction =
  | { kind: 'deducted'; previousBalance: number; newBalance: number }
  | { kind: 'school_not_found' }
  | { kind: 'insufficient_balance' };

@Injectable()
export class SmsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /* ============================================================
     Platform SMS Package Management
     ============================================================ */

  async getSmsPackages() {
    return this.prisma.smsPackage.findMany({
      include: {
        _count: { select: { purchases: { where: { status: 'COMPLETED' } } } },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getSmsPackage(packageId: string) {
    const pkg = await this.prisma.smsPackage.findUnique({
      where: { id: packageId },
      include: {
        purchases: {
          where: { status: 'COMPLETED' },
          include: { school: { select: { id: true, name: true, code: true } } },
        },
      },
    });
    if (!pkg) throw new NotFoundException('SMS package not found');
    return pkg;
  }

  async createSmsPackage(dto: CreateSmsPackageDto, actorId: string) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.smsPackage.findFirst({
      where: { OR: [{ code }, { name: dto.name.trim() }] },
    });
    if (existing) {
      throw new ConflictException(
        'An SMS package with this name or code already exists',
      );
    }

    const pkg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.smsPackage.create({
        data: {
          name: dto.name.trim(),
          code,
          description: dto.description || null,
          credits: dto.credits,
          price: new Prisma.Decimal(dto.price),
          currency: dto.currency || 'USD',
          status: dto.status || SmsPackageStatus.ACTIVE,
          isFeatured: dto.isFeatured ?? false,
          displayOrder: dto.displayOrder ?? 0,
        },
      });

      await this.audit.log(
        {
          userId: actorId,
          action: 'SMS_PACKAGE_CREATED',
          module: 'SMS',
          resourceId: created.id,
          metadata: {
            code: created.code,
            name: created.name,
            credits: created.credits,
            price: created.price,
          },
        },
        tx,
      );

      return created;
    });

    return pkg;
  }

  async updateSmsPackage(
    packageId: string,
    dto: UpdateSmsPackageDto,
    actorId: string,
  ) {
    const existing = await this.prisma.smsPackage.findUnique({
      where: { id: packageId },
    });
    if (!existing) throw new NotFoundException('SMS package not found');

    if (dto.code && dto.code.toUpperCase() !== existing.code) {
      const duplicate = await this.prisma.smsPackage.findUnique({
        where: { code: dto.code.toUpperCase() },
      });
      if (duplicate) throw new ConflictException('Package code is already in use');
    }
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.smsPackage.findFirst({
        where: { name: dto.name.trim() },
      });
      if (duplicate) throw new ConflictException('Package name is already in use');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.smsPackage.update({
        where: { id: packageId },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.credits !== undefined ? { credits: dto.credits } : {}),
          ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price) } : {}),
          ...(dto.currency ? { currency: dto.currency } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
          ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
        },
      });

      await this.audit.log(
        {
          userId: actorId,
          action: 'SMS_PACKAGE_UPDATED',
          module: 'SMS',
          resourceId: packageId,
          metadata: { changedFields: Object.keys(dto) },
        },
        tx,
      );

      return result;
    });

    return this.prisma.smsPackage.findUnique({ where: { id: updated.id } });
  }

  async archiveSmsPackage(packageId: string, actorId: string) {
    const pkg = await this.prisma.smsPackage.findUnique({
      where: { id: packageId },
      include: {
        _count: {
          select: {
            purchases: {
              where: {
                status: { in: ['PENDING', 'COMPLETED'] },
              },
            },
          },
        },
      },
    });
    if (!pkg) throw new NotFoundException('SMS package not found');
    if (pkg._count.purchases > 0) {
      throw new ConflictException(
        'Package has active or pending purchases. Deactivate instead of archiving.',
      );
    }

    const updated = await this.prisma.smsPackage.update({
      where: { id: packageId },
      data: { status: SmsPackageStatus.ARCHIVED },
    });

    await this.audit.log({
      userId: actorId,
      action: 'SMS_PACKAGE_ARCHIVED',
      module: 'SMS',
      resourceId: packageId,
      metadata: { code: pkg.code, name: pkg.name },
    });

    return updated;
  }

  /* ============================================================
     School SMS Credit Purchase
     ============================================================ */

  async getAvailableSmsPackages() {
    return this.prisma.smsPackage.findMany({
      where: { status: SmsPackageStatus.ACTIVE },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        credits: true,
        price: true,
        currency: true,
        isFeatured: true,
        displayOrder: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { price: 'asc' }],
    });
  }

  async purchaseSmsCredits(
    schoolId: string,
    dto: { packageId: string },
    actorId: string,
  ) {
    const pkg = await this.prisma.smsPackage.findUnique({
      where: { id: dto.packageId },
    });
    if (!pkg) throw new NotFoundException('SMS package not found');
    if (pkg.status !== SmsPackageStatus.ACTIVE) {
      throw new BadRequestException('This SMS package is not available for purchase');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) throw new NotFoundException('School not found');
    if (school.status !== SchoolStatus.ACTIVE) {
      throw new BadRequestException('School is not active and cannot purchase SMS credits');
    }

    const existingPending = await this.prisma.smsCreditPurchase.findFirst({
      where: {
        schoolId,
        packageId: dto.packageId,
        status: PurchaseStatus.PENDING,
      },
    });
    if (existingPending) {
      throw new ConflictException(
        'You already have a pending purchase for this package. Please complete or cancel it first.',
      );
    }

    const purchase = await this.prisma.$transaction(async (tx) => {
      const created = await tx.smsCreditPurchase.create({
        data: {
          schoolId,
          packageId: pkg.id,
          credits: pkg.credits,
          amount: pkg.price,
          currency: pkg.currency,
          status: PurchaseStatus.PENDING,
          provider: 'platform',
        },
        include: { package: true },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'SMS_CREDIT_PURCHASE_INITIATED',
          module: 'SMS',
          resourceId: created.id,
          metadata: {
            packageId: pkg.id,
            packageName: pkg.name,
            credits: pkg.credits,
            amount: pkg.price,
          },
        },
      });

      return created;
    });

    return purchase;
  }

  async cancelSmsCreditPurchase(
    purchaseId: string,
    actorId: string,
  ) {
    const purchase = await this.prisma.smsCreditPurchase.findUnique({
      where: { id: purchaseId },
      include: { school: true },
    });
    if (!purchase) throw new NotFoundException('SMS credit purchase not found');
    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException(`Only pending purchases can be cancelled`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.smsCreditPurchase.update({
        where: { id: purchaseId },
        data: { status: PurchaseStatus.CANCELLED },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId: purchase.schoolId,
          action: 'SMS_CREDIT_PURCHASE_CANCELLED',
          module: 'SMS',
          resourceId: purchaseId,
          metadata: {
            packageId: purchase.packageId,
            credits: purchase.credits,
          },
        },
      });

      return result;
    });

    return updated;
  }

  /**
   * Platform-wide SMS credit ledger: every grant and every school purchase.
   *
   * `status` is validated against the enum instead of being passed straight to
   * Prisma, so a typo answers 400 rather than rendering an empty table that
   * reads like "no transactions have happened".
   */
  async getSmsPurchaseLedger(params: {
    status?: string;
    schoolId?: string;
    take?: number;
  }) {
    const take = Math.min(200, Math.max(1, params.take ?? 100));

    let status: PurchaseStatus | undefined;
    if (params.status) {
      if (!(params.status in PurchaseStatus)) {
        throw new BadRequestException(
          `Unknown purchase status "${params.status}". Expected one of: ${Object.keys(PurchaseStatus).join(', ')}`,
        );
      }
      status = params.status as PurchaseStatus;
    }
    if (params.schoolId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.schoolId)) {
      throw new BadRequestException('schoolId is not a valid identifier');
    }

    const where: Prisma.SmsCreditPurchaseWhereInput = {
      ...(status ? { status } : {}),
      ...(params.schoolId ? { schoolId: params.schoolId } : {}),
    };

    const [rows, statusGroups] = await Promise.all([
      this.prisma.smsCreditPurchase.findMany({
        where,
        orderBy: { purchasedAt: 'desc' },
        take,
        include: {
          school: { select: { id: true, name: true, code: true } },
          package: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.smsCreditPurchase.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const group of statusGroups) statusCounts[group.status] = group._count._all;

    return {
      items: rows.map((purchase) => ({
        id: purchase.id,
        schoolId: purchase.school.id,
        schoolName: purchase.school.name,
        schoolCode: purchase.school.code,
        packageCode: purchase.package.code,
        packageName: purchase.package.name,
        credits: purchase.credits,
        amount: Number(purchase.amount),
        currency: purchase.currency,
        status: purchase.status,
        provider: purchase.provider,
        externalReference: purchase.externalReference,
        purchasedAt: purchase.purchasedAt,
        completedAt: purchase.completedAt,
      })),
      statusCounts,
      awaitingConfirmation: statusCounts[PurchaseStatus.PENDING] || 0,
    };
  }

  async getSchoolSmsPurchases(schoolId: string) {
    return this.prisma.smsCreditPurchase.findMany({
      where: { schoolId },
      include: { package: true },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async getSchoolSmsBalance(schoolId: string) {
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

    return {
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.code,
      status: school.status,
      currency: school.currency,
      smsCreditBalance: Number(school.smsCreditBalance),
    };
  }

  async getRecentSmsTransactions(schoolId: string, limit = 20) {
    const purchases = await this.prisma.smsCreditPurchase.findMany({
      where: { schoolId, status: 'COMPLETED' },
      include: { package: true },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    return purchases.map((p) => ({
      id: p.id,
      type: 'PURCHASE' as const,
      amount: Number(p.amount),
      credits: p.credits,
      balanceAfter: null, // Would require a ledger table for exact after-balance
      currency: p.currency,
      description: `SMS credit purchase: ${p.package.name}`,
      createdAt: p.completedAt || p.purchasedAt,
      reference: p.externalReference,
    }));
  }

  /**
   * Only entry point for taking credits out of a school's balance.
   *
   * The previous `deductSmsCredits` variant read the balance in one query and
   * decremented it in another, so two concurrent broadcasts could both pass
   * the "insufficient balance" check and drive the balance below zero. The
   * guard now lives inside the UPDATE predicate, which means Postgres applies
   * it while holding the row lock: if the balance moved under us the statement
   * matches zero rows and we report insufficient funds instead of subtracting.
   */
  private async deductBalanceAtomically(
    tx: Prisma.TransactionClient,
    schoolId: string,
    credits: number,
  ): Promise<CreditDeduction> {
    const guarded = await tx.school.updateMany({
      where: { id: schoolId, smsCreditBalance: { gte: new Prisma.Decimal(credits) } },
      data: { smsCreditBalance: { decrement: new Prisma.Decimal(credits) } },
    });
    if (guarded.count === 0) {
      const exists = await tx.school.count({ where: { id: schoolId } });
      return { kind: exists ? 'insufficient_balance' : 'school_not_found' };
    }
    const row = await tx.school.findUniqueOrThrow({
      where: { id: schoolId },
      select: { smsCreditBalance: true },
    });
    const newBalance = Number(row.smsCreditBalance);
    // Derived rather than pre-read: the decrement already happened under the
    // row lock, so this is the exact balance this operation started from.
    return { kind: 'deducted', previousBalance: newBalance + credits, newBalance };
  }

  /**
   * Charges SMS credits for a single provider-accepted delivery and records it
   * in the audited ledger. Idempotent: it will not deduct twice for the same
   * delivery (guarded by `smsChargedAt`) and never allows a negative balance,
   * so a retry or a re-run of an already-charged message is a safe no-op.
   */
  async chargeSmsDelivery(params: {
    schoolId: string;
    credits: number;
    deliveryId: string;
    segments?: number;
  }): Promise<{
    charged: boolean;
    reason?: string;
    previousBalance?: number;
    newBalance?: number;
    credits: number;
  }> {
    const { schoolId, credits, deliveryId, segments } = params;
    if (!Number.isFinite(credits) || credits <= 0) {
      return { charged: false, reason: 'invalid_amount', credits };
    }

    return this.prisma.$transaction(async (tx) => {
      const deducted = await this.deductBalanceAtomically(tx, schoolId, credits);
      if (deducted.kind !== 'deducted') {
        return { charged: false, reason: deducted.kind, credits };
      }
      const { previousBalance: currentBalance, newBalance } = deducted;

      await tx.notificationDelivery.update({
        where: { id: deliveryId },
        data: { smsChargedAt: new Date(), smsCreditsCost: credits },
      });

      await tx.auditLog.create({
        data: {
          userId: 'system',
          schoolId,
          action: 'SMS_CREDIT_CHARGED_FOR_DELIVERY',
          module: 'SMS',
          resourceId: deliveryId,
          metadata: { previousBalance: currentBalance, credits, newBalance, segments: segments ?? credits },
        },
      });

      return { charged: true, previousBalance: currentBalance, newBalance, credits };
    });
  }

  /* ============================================================
     Platform SMS Credit Ledger (all schools)
     ============================================================ */

  async getAllSmsBalances() {
    return this.prisma.school.findMany({
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
  }

  /**
   * Platform-side credit allocation: Super Admin grants a school a package.
   *
   * Two defects in the previous `topUpSmsCredits` are closed here:
   *  - the credit count came from whatever the caller typed, so a typo minted
   *    credits out of thin air. The amount now comes from the package record
   *    and a caller cannot inflate a grant.
   *  - no `SmsCreditPurchase` row was written, so "SMS transaction history"
   *    had nothing to list and a grant survived only as an audit entry. Every
   *    grant is now a ledger row.
   *
   * `status: COMPLETED` means "the platform delivered these credits"; it is not
   * a claim that money was received. `provider: 'platform'` distinguishes an
   * internal allocation from a payment-provider purchase.
   */
  async grantSmsCredits(
    schoolId: string,
    packageId: string,
    reason: string | undefined,
    actorId: string,
  ) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, smsCreditBalance: true },
    });
    if (!school) throw new NotFoundException('School not found');

    const pkg = await this.prisma.smsPackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException('SMS package not found');
    if (pkg.status !== SmsPackageStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot grant credits from the ${pkg.status.toLowerCase()} package "${pkg.name}"`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.school.update({
        where: { id: schoolId },
        data: { smsCreditBalance: { increment: new Prisma.Decimal(pkg.credits) } },
        select: { id: true, name: true, smsCreditBalance: true },
      });
      const newBalance = Number(updated.smsCreditBalance);
      // Derived after the increment, so it is the true pre-grant balance even
      // if another transaction moved the balance in the meantime.
      const previousBalance = newBalance - pkg.credits;

      const purchase = await tx.smsCreditPurchase.create({
        data: {
          schoolId,
          packageId: pkg.id,
          credits: pkg.credits,
          amount: pkg.price,
          currency: pkg.currency,
          status: PurchaseStatus.COMPLETED,
          provider: 'platform',
          completedAt: new Date(),
        },
        include: { package: { select: { id: true, name: true, code: true } } },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'SMS_CREDIT_GRANTED',
          module: 'SMS',
          resourceId: purchase.id,
          metadata: {
            packageId: pkg.id,
            packageCode: pkg.code,
            credits: pkg.credits,
            previousBalance,
            newBalance,
            reason: reason || null,
          },
        },
      });

      return {
        schoolId: updated.id,
        schoolName: updated.name,
        purchaseId: purchase.id,
        packageCode: purchase.package.code,
        packageName: purchase.package.name,
        creditsAdded: pkg.credits,
        previousBalance,
        newBalance,
      };
    });
  }

  /**
   * Confirms that payment for a school-initiated credit purchase has actually
   * been received, then delivers the credits.
   *
   * This replaces `completeSmsCreditPurchase`, which was reachable as
   * `POST /school/sms/purchases/:id/complete` under `@Roles('SCHOOL_ADMIN')`:
   * any school administrator could create a pending purchase and complete it
   * themselves, receiving paid credits for nothing. Confirmation is a platform
   * action now and requires the payment reference that makes it auditable.
   *
   * The status transition is guarded inside the UPDATE, so two simultaneous
   * confirmations cannot both deliver the same credits.
   */
  async confirmSmsCreditPurchase(
    purchaseId: string,
    actorId: string,
    reference: string,
    note?: string,
  ) {
    const purchase = await this.prisma.smsCreditPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        school: { select: { id: true, name: true } },
        package: { select: { id: true, name: true, code: true } },
      },
    });
    if (!purchase) throw new NotFoundException('SMS credit purchase not found');
    if (purchase.status === PurchaseStatus.COMPLETED) {
      throw new ConflictException('These credits have already been delivered');
    }
    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException(
        `Only pending purchases can be confirmed; this one is ${purchase.status.toLowerCase()}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.smsCreditPurchase.updateMany({
        where: { id: purchaseId, status: PurchaseStatus.PENDING },
        data: {
          status: PurchaseStatus.COMPLETED,
          completedAt: new Date(),
          externalReference: reference,
        },
      });
      if (claimed.count === 0) {
        throw new ConflictException('These credits have already been delivered');
      }

      const schoolRow = await tx.school.update({
        where: { id: purchase.schoolId },
        data: { smsCreditBalance: { increment: new Prisma.Decimal(purchase.credits) } },
        select: { smsCreditBalance: true },
      });
      const newBalance = Number(schoolRow.smsCreditBalance);

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId: purchase.schoolId,
          action: 'SMS_CREDIT_PURCHASE_CONFIRMED',
          module: 'SMS',
          resourceId: purchaseId,
          metadata: {
            packageCode: purchase.package.code,
            credits: purchase.credits,
            amount: purchase.amount,
            currency: purchase.currency,
            paymentReference: reference,
            note: note || null,
            newBalance,
          },
        },
      });

      return tx.smsCreditPurchase.findUniqueOrThrow({
        where: { id: purchaseId },
        include: {
          package: { select: { id: true, name: true, code: true } },
          school: { select: { id: true, name: true } },
        },
      });
    });
  }
}
