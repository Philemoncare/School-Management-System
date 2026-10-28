import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class FinanceDashboardService {
  constructor(private prisma: PrismaService) {}

  async getFinancialReport(schoolId: string) {
    const [{ metrics }, categoryTotals, recentPayments, paymentMethods] = await Promise.all([
      this.getAccountantMetrics(schoolId),
      this.prisma.invoiceItem.groupBy({
        by: ['feeCategoryId'],
        where: {
          invoice: {
            is: {
              schoolId,
              status: { notIn: [InvoiceStatus.VOID, InvoiceStatus.CANCELLED] },
            },
          },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.payment.findMany({
        where: { schoolId, status: PaymentStatus.SUCCESS },
        include: { student: { select: { firstName: true, lastName: true, studentNumber: true } } },
        orderBy: { paymentDate: 'desc' },
        take: 8,
      }),
      this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { schoolId, status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const categoryIds = categoryTotals.map((item) => item.feeCategoryId);
    const categories = categoryIds.length
      ? await this.prisma.feeCategory.findMany({
          where: { id: { in: categoryIds }, schoolId },
          select: { id: true, name: true, code: true },
        })
      : [];

    return {
      metrics,
      revenueByCategory: categoryTotals.map((item) => ({
        category: categories.find((category) => category.id === item.feeCategoryId) || null,
        amount: item._sum.totalAmount || 0,
      })),
      collectionsByMethod: paymentMethods.map((item) => ({
        method: item.paymentMethod,
        amount: item._sum.amount || 0,
        count: item._count._all,
      })),
      recentPayments,
    };
  }

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
    const collectionRate = Number(billed) > 0 ? (Number(collected) / Number(billed)) * 100 : 0;

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
