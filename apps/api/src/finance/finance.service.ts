import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFeeCategoryDto } from './dto/fee-category.dto';
import { CreateFeeStructureDto } from './dto/fee-structure.dto';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { RecordPaymentDto } from './dto/payment.dto';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private settings: SettingsService,
  ) {}

  // Fee Categories
  async createCategory(schoolId: string, dto: CreateFeeCategoryDto, actorId: string) {
    const existing = await this.prisma.feeCategory.findFirst({
      where: { schoolId, code: dto.code },
    });
    if (existing) throw new ConflictException('Fee category code already exists');

    const category = await this.prisma.feeCategory.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'FEE_CATEGORY_CREATED',
      module: 'FINANCE',
      resourceId: category.id,
    });

    return category;
  }

  async findAllCategories(schoolId: string) {
    return this.prisma.feeCategory.findMany({
      where: { schoolId, isActive: true },
      orderBy: { name: 'asc' }
    });
  }

  // Fee Structures
  async createStructure(schoolId: string, dto: CreateFeeStructureDto, actorId: string) {
    const structure = await this.prisma.feeStructure.create({
      data: {
        ...dto,
        schoolId,
        amount: new Prisma.Decimal(dto.amount),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'FEE_STRUCTURE_CREATED',
      module: 'FINANCE',
      resourceId: structure.id,
    });

    return structure;
  }

  async findStructures(schoolId: string, filters: any) {
    return this.prisma.feeStructure.findMany({
      where: { schoolId, ...filters },
      include: { feeCategory: true, academicYear: true, term: true, class: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Invoicing
  async createInvoice(schoolId: string, dto: CreateInvoiceDto, actorId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId: dto.studentId, academicYearId: dto.academicYearId, schoolId },
    });
    if (!enrollment) throw new NotFoundException('Active enrollment not found for student');

    const feeStructures = await this.prisma.feeStructure.findMany({
      where: { id: { in: dto.feeStructureIds || [] }, schoolId },
      include: { feeCategory: true },
    });

    const subtotal = feeStructures.reduce((acc, f) => acc.add(f.amount), new Prisma.Decimal(0));
    const invoiceNumber = await this.settings.generateNextNumber(schoolId, 'INVOICE');

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          schoolId,
          studentId: dto.studentId,
          enrollmentId: enrollment.id,
          academicYearId: dto.academicYearId,
          termId: dto.termId,
          invoiceNumber,
          dueDate: dto.dueDate,
          subtotal,
          totalAmount: subtotal,
          balance: subtotal,
          status: InvoiceStatus.ISSUED,
          createdBy: actorId,
          items: {
            create: feeStructures.map(f => ({
              feeCategoryId: f.feeCategoryId,
              description: f.name,
              unitAmount: f.amount,
              totalAmount: f.amount,
            })),
          },
        },
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'INVOICE_ISSUED',
        module: 'FINANCE',
        resourceId: invoice.id,
      });

      return invoice;
    });
  }

  async findAllInvoices(schoolId: string, filters: any = {}) {
    const { search, ...rest } = filters;
    return this.prisma.invoice.findMany({
      where: {
        schoolId,
        ...rest,
        OR: search ? [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { student: { firstName: { contains: search, mode: 'insensitive' } } },
          { student: { lastName: { contains: search, mode: 'insensitive' } } },
        ] : undefined,
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
        items: true,
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  async findOneInvoice(schoolId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, schoolId },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true, id: true } },
        items: { include: { feeCategory: true } },
        allocations: { include: { payment: true } },
        academicYear: true,
        term: true,
        class: true,
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  // Payments
  async recordPayment(schoolId: string, dto: RecordPaymentDto, actorId: string) {
    const paymentReference = await this.settings.generateNextNumber(schoolId, 'PAYMENT');
    const amount = new Prisma.Decimal(dto.amount);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          schoolId,
          studentId: dto.studentId,
          paymentReference,
          externalReference: dto.externalReference,
          amount,
          paymentMethod: dto.paymentMethod,
          status: PaymentStatus.SUCCESS,
          verifiedAt: new Date(),
          verifiedBy: actorId,
        },
      });

      if (dto.allocations) {
        for (const alloc of dto.allocations) {
          const invoice = await tx.invoice.findUnique({ where: { id: alloc.invoiceId } });
          if (!invoice) continue;

          const allocAmount = new Prisma.Decimal(alloc.amount);
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

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'PAYMENT_RECEIVED',
        module: 'FINANCE',
        resourceId: payment.id,
      });

      return payment;
    });
  }

  async getOutstandingBalances(schoolId: string, filters: any = {}) {
    return this.prisma.invoice.findMany({
      where: {
        schoolId,
        balance: { gt: 0 },
        status: { notIn: [InvoiceStatus.VOID, InvoiceStatus.CANCELLED] },
        ...filters,
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentNumber: true,
          }
        },
        academicYear: true,
        term: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findAllReceipts(schoolId: string, filters: any = {}) {
    const { search, ...rest } = filters;
    return this.prisma.receipt.findMany({
      where: {
        schoolId,
        ...rest,
        OR: search ? [
          { receiptNumber: { contains: search, mode: 'insensitive' } },
          { student: { firstName: { contains: search, mode: 'insensitive' } } },
          { student: { lastName: { contains: search, mode: 'insensitive' } } },
        ] : undefined,
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentStatement(schoolId: string, studentId: string) {
    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { studentId, schoolId },
        include: { items: true },
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { studentId, schoolId },
        include: { allocations: true },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    const totalInvoiced = invoices.reduce((acc, i) => acc.add(i.totalAmount), new Prisma.Decimal(0));
    const totalPaid = payments.reduce((acc, p) => acc.add(p.amount), new Prisma.Decimal(0));

    return {
      invoices,
      payments,
      summary: {
        totalInvoiced,
        totalPaid,
        balance: totalInvoiced.sub(totalPaid),
      },
    };
  }
}
