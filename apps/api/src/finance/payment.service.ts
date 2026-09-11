import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerService } from './ledger.service';
import { CommunicationService } from '../communication/communication.service';
import { RecordPaymentDto } from './dto/payment.dto';
import { PaymentStatus, InvoiceStatus, LedgerTransactionType, LedgerDirection, Prisma } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private ledger: LedgerService,
    private comms: CommunicationService,
  ) {}

  async recordManualPayment(schoolId: string, dto: RecordPaymentDto, actorId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    const currency = dto.currency || school?.currency || 'USD';
    const paymentReference = `PAY-${school?.code || 'SCH'}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const amount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Payment
      const payment = await tx.payment.create({
        data: {
          schoolId,
          studentId: dto.studentId,
          paymentReference,
          externalReference: dto.externalReference,
          amount,
          currency,
          paymentMethod: dto.paymentMethod,
          status: PaymentStatus.SUCCESS,
          verifiedAt: new Date(),
          verifiedBy: actorId,
        },
      });

      // 2. Handle Allocations
      if (dto.allocations) {
        for (const alloc of dto.allocations) {
          const invoice = await tx.invoice.findUnique({ where: { id: alloc.invoiceId } });
          if (!invoice || invoice.schoolId !== schoolId) continue;

          if (invoice.currency !== currency) {
            throw new BadRequestException(`Currency mismatch: Payment (${currency}) vs Invoice (${invoice.currency})`);
          }

          const allocAmount = Prisma.Decimal.min(new Prisma.Decimal(alloc.amount), invoice.balance);

          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: alloc.invoiceId,
              amount: allocAmount,
            },
          });

          const newPaid = invoice.amountPaid.add(allocAmount);
          const newBalance = invoice.totalAmount.sub(newPaid);
          const newStatus = newBalance.lte(0) ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

          await tx.invoice.update({
            where: { id: alloc.invoiceId },
            data: {
              amountPaid: newPaid,
              balance: newBalance,
              status: newStatus,
            },
          });
        }
      }

      // 3. Record in Ledger
      await this.ledger.recordEntry({
        schoolId,
        studentId: dto.studentId,
        transactionType: LedgerTransactionType.PAYMENT,
        amount: amount,
        currency,
        direction: LedgerDirection.CREDIT,
        description: `Payment ${paymentReference} recorded`,
        referenceId: payment.id,
        referenceType: 'Payment',
        actorId,
        tx,
      });

      // 4. Generate Receipt
      const receiptNumber = `RCP-${school?.code || 'SCH'}-${Date.now().toString().slice(-6)}`;
      const receipt = await tx.receipt.create({
        data: {
          schoolId,
          studentId: dto.studentId,
          paymentId: payment.id,
          receiptNumber,
          amount: amount,
          currency,
          paymentMethod: dto.paymentMethod,
          paymentDate: new Date(),
          issuedBy: actorId,
        },
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'PAYMENT_RECORDED',
        module: 'FINANCE',
        resourceId: payment.id,
        tx,
      });

      // 5. Notify Student/Guardian
      if (student?.userId) {
        try {
          await this.comms.sendNotification({
            schoolId,
            userId: student.userId,
            type: 'PAYMENT_RECEIVED',
            data: {
              amount: amount.toString(),
              currency,
              paymentReference,
              receiptNumber,
            }
          });
        } catch (err) {
          console.error('Failed to send payment notification', err);
        }
      }

      return payment;
    });
  }

  async getPayments(schoolId: string, filters: any = {}) {
    const { search, ...rest } = filters;
    return this.prisma.payment.findMany({
      where: {
        schoolId,
        ...rest,
        OR: search ? [
          { paymentReference: { contains: search, mode: 'insensitive' } },
          { externalReference: { contains: search, mode: 'insensitive' } },
          { student: { firstName: { contains: search, mode: 'insensitive' } } },
          { student: { lastName: { contains: search, mode: 'insensitive' } } },
        ] : undefined,
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
        allocations: { include: { invoice: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
