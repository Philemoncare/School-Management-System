import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class FinanceDashboardService {
  constructor(private prisma: PrismaService) {}

  async getAccountantMetrics(schoolId: string) {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBilled,
      totalCollected,
      outstanding,
      overdueCount,
      paymentsToday,
      paymentsWeek,
      paymentsMonth,
      unpaidInvoices,
      partiallyPaidInvoices,
      studentsWithBalance,
    ] = await Promise.all([
      // Total Billed
      this.prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { schoolId, status: { notIn: [InvoiceStatus.VOID, InvoiceStatus.CANCELLED] } },
      }),
      // Total Collected
      this.prisma.invoice.aggregate({
        _sum: { amountPaid: true },
        where: { schoolId, status: { notIn: [InvoiceStatus.VOID, InvoiceStatus.CANCELLED] } },
      }),
      // Outstanding
      this.prisma.invoice.aggregate({
        _sum: { balance: true },
        where: { schoolId, status: { notIn: [InvoiceStatus.VOID, InvoiceStatus.CANCELLED] } },
      }),
      // Overdue Invoices
      this.prisma.invoice.count({
        where: { schoolId, status: InvoiceStatus.OVERDUE },
      }),
      // Payments Today
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { schoolId, status: PaymentStatus.SUCCESS, paymentDate: { gte: startOfToday } },
      }),
      // Payments Week
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { schoolId, status: PaymentStatus.SUCCESS, paymentDate: { gte: startOfWeek } },
      }),
      // Payments Month
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { schoolId, status: PaymentStatus.SUCCESS, paymentDate: { gte: startOfMonth } },
      }),
      // Unpaid Invoices
      this.prisma.invoice.count({
        where: { schoolId, status: InvoiceStatus.ISSUED },
      }),
      // Partially Paid Invoices
      this.prisma.invoice.count({
        where: { schoolId, status: InvoiceStatus.PARTIALLY_PAID },
      }),
      // Students with Outstanding Balances
      this.prisma.student.count({
        where: {
          schoolId,
          invoices: {
            some: { balance: { gt: 0 }, status: { notIn: [InvoiceStatus.VOID, InvoiceStatus.CANCELLED] } },
          },
        },
      }),
    ]);

    const billed = totalBilled._sum.totalAmount || 0;
    const collected = totalCollected._sum.amountPaid || 0;
    const collectionRate = billed > 0 ? (Number(collected) / Number(billed)) * 100 : 0;

    return {
      metrics: {
        totalBilled: billed,
        totalCollected: collected,
        outstanding: outstanding._sum.balance || 0,
        overdueCount,
        paymentsToday: paymentsToday._sum.amount || 0,
        paymentsWeek: paymentsWeek._sum.amount || 0,
        paymentsMonth: paymentsMonth._sum.amount || 0,
        collectionRate: collectionRate.toFixed(2),
        unpaidInvoices,
        partiallyPaidInvoices,
        studentsWithBalance,
      },
    };
  }
}
