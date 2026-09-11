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
    return this.prisma.ledgerEntry.findMany({
      where: {
        schoolId,
        ...filters,
      },
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
