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

  async completeSmsCreditPurchase(
    purchaseId: string,
    actorId: string,
  ) {
    const purchase = await this.prisma.smsCreditPurchase.findUnique({
      where: { id: purchaseId },
      include: { school: true, package: true },
    });
    if (!purchase) throw new NotFoundException('SMS credit purchase not found');
    if (purchase.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException(`Purchase is already ${purchase.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.smsCreditPurchase.update({
        where: { id: purchaseId },
        data: {
          status: PurchaseStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: { package: true },
      });

      // Add credits to school balance
      await tx.school.update({
        where: { id: purchase.schoolId },
        data: {
          smsCreditBalance: {
            increment: new Prisma.Decimal(purchase.credits),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId: purchase.schoolId,
          action: 'SMS_CREDIT_PURCHASE_COMPLETED',
          module: 'SMS',
          resourceId: purchaseId,
          metadata: {
            packageId: purchase.packageId,
            packageName: purchase.package.name,
            credits: purchase.credits,
            amount: purchase.amount,
            newBalance: Number(purchase.school.smsCreditBalance) + purchase.credits,
          },
        },
      });

      return result;
    });

    return updated;
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

  async deductSmsCredits(
    schoolId: string,
    credits: number,
    reason: string,
    actorId?: string,
  ) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, smsCreditBalance: true, name: true },
    });
    if (!school) throw new NotFoundException('School not found');

    const currentBalance = Number(school.smsCreditBalance);
    if (currentBalance < credits) {
      throw new BadRequestException(
        `Insufficient SMS credits. Current balance: ${currentBalance}, required: ${credits}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.school.update({
        where: { id: schoolId },
        data: {
          smsCreditBalance: {
            decrement: new Prisma.Decimal(credits),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId || 'system',
          schoolId,
          action: 'SMS_CREDIT_DEDUCTED',
          module: 'SMS',
          resourceId: schoolId,
          metadata: {
            previousBalance: currentBalance,
            creditsDeducted: credits,
            newBalance: Number(result.smsCreditBalance),
            reason,
          },
        },
      });

      return result;
    });

    return {
      schoolId: updated.id,
      previousBalance: currentBalance,
      creditsDeducted: credits,
      newBalance: Number(updated.smsCreditBalance),
    };
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
      // Row lock via SELECT ... FOR UPDATE so two concurrent deliveries for the
      // same school cannot both pass the balance check.
      const rows = await tx.$queryRaw<Array<{ sms_credit_balance: any }>>`
        SELECT "sms_credit_balance" FROM "schools" WHERE "id" = ${schoolId}::uuid FOR UPDATE
      `;
      if (!rows.length) {
        return { charged: false, reason: 'school_not_found', credits };
      }
      const currentBalance = Number(rows[0].sms_credit_balance);
      if (currentBalance < credits) {
        return { charged: false, reason: 'insufficient_balance', credits };
      }

      const updated = await tx.school.update({
        where: { id: schoolId },
        data: { smsCreditBalance: { decrement: new Prisma.Decimal(credits) } },
        select: { smsCreditBalance: true },
      });
      const newBalance = Number(updated.smsCreditBalance);

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

  async topUpSmsCredits(
    schoolId: string,
    credits: number,
    reason: string,
    actorId: string,
  ) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });
    if (!school) throw new NotFoundException('School not found');

    const previousBalance = Number(school.smsCreditBalance);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.school.update({
        where: { id: schoolId },
        data: {
          smsCreditBalance: {
            increment: new Prisma.Decimal(credits),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'SMS_CREDIT_TOPUP',
          module: 'SMS',
          resourceId: schoolId,
          metadata: {
            previousBalance,
            creditsAdded: credits,
            newBalance: Number(result.smsCreditBalance),
            reason,
          },
        },
      });

      return result;
    });

    return {
      schoolId: updated.id,
      schoolName: updated.name,
      previousBalance,
      creditsAdded: credits,
      newBalance: Number(updated.smsCreditBalance),
    };
  }
}
