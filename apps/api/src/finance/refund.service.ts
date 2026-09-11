import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerService } from './ledger.service';
import { RefundStatus, LedgerTransactionType, LedgerDirection, Prisma } from '@prisma/client';

@Injectable()
export class RefundService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private ledger: LedgerService,
  ) {}

  async processRefund(schoolId: string, dto: {
    paymentId: string;
    amount: number | Prisma.Decimal;
    reason: string;
  }, actorId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { refunds: true }
    });

    if (!payment || payment.schoolId !== schoolId) throw new NotFoundException('Payment not found');

    const totalRefunded = payment.refunds
      .filter(r => r.status === RefundStatus.COMPLETED)
      .reduce((acc, r) => acc.add(r.amount), new Prisma.Decimal(0));

    const refundableAmount = payment.amount.sub(totalRefunded);
    const refundAmount = new Prisma.Decimal(dto.amount);

    if (refundAmount.gt(refundableAmount)) {
      throw new BadRequestException('Refund amount exceeds refundable balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          schoolId,
          paymentId: dto.paymentId,
          amount: refundAmount,
          currency: payment.currency,
          reason: dto.reason,
          status: RefundStatus.COMPLETED,
          createdBy: actorId,
          approvedBy: actorId,
          approvedAt: new Date(),
        }
      });

      // Update Ledger
      await this.ledger.recordEntry({
        schoolId,
        studentId: payment.studentId,
        transactionType: LedgerTransactionType.REFUND,
        amount: refundAmount,
        currency: payment.currency,
        direction: LedgerDirection.DEBIT, // Refund increases student's debt/debit
        description: `Refund for payment ${payment.paymentReference}`,
        referenceId: refund.id,
        referenceType: 'Refund',
        actorId,
        tx,
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'REFUND_PROCESSED',
        module: 'FINANCE',
        resourceId: refund.id,
        tx,
      });

      return refund;
    });
  }
}
