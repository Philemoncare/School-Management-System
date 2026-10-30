import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerTransactionType, LedgerDirection, Prisma } from '@prisma/client';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async recordEntry(params: {
    schoolId: string;
    studentId?: string;
    transactionType: LedgerTransactionType;
    amount: Prisma.Decimal | number;
    currency: string;
    direction: LedgerDirection;
    description?: string;
    referenceId?: string;
    referenceType?: string;
    actorId?: string;
    tx?: Prisma.TransactionClient;
  }) {
    const { tx, ...data } = params;
    const client = tx || this.prisma;

    return client.ledgerEntry.create({
      data: {
        schoolId: data.schoolId,
        studentId: data.studentId,
        transactionType: data.transactionType,
        amount: data.amount,
        currency: data.currency,
        direction: data.direction,
        description: data.description,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        actorId: data.actorId,
      },
    });
  }

  async getLedger(schoolId: string, filters: any = {}) {
    const where: any = { schoolId };
    for (const key of ['studentId', 'transactionType', 'direction', 'referenceType', 'referenceId'] as const) {
      const value = filters?.[key];
      if (typeof value === 'string' && value.trim()) where[key] = value.trim();
    }

    const from = typeof filters?.from === 'string' ? filters.from.trim() : '';
    const to = typeof filters?.to === 'string' ? filters.to.trim() : '';
    if (from || to) {
      where.createdAt = {};
      if (from) {
        const start = new Date(from);
        if (!Number.isNaN(start.getTime())) where.createdAt.gte = start;
      }
      if (to) {
        const end = new Date(to);
        if (!Number.isNaN(end.getTime())) {
          end.setDate(end.getDate() + 1);
          where.createdAt.lt = end;
        }
      }
      if (Object.keys(where.createdAt).length === 0) delete where.createdAt;
    }

    return this.prisma.ledgerEntry.findMany({
      where,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
