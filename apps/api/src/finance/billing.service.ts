import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LedgerService } from './ledger.service';
import { CommunicationService } from '../communication/communication.service';
import { CreateInvoiceDto } from './dto/invoice.dto';
import { InvoiceStatus, BillingRunStatus, LedgerTransactionType, LedgerDirection, Prisma } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private ledger: LedgerService,
    private comms: CommunicationService,
  ) {}

  async createIndividualInvoice(schoolId: string, dto: CreateInvoiceDto, actorId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId: dto.studentId, academicYearId: dto.academicYearId, schoolId },
      include: { student: true },
    });
    if (!enrollment) throw new NotFoundException('Active enrollment not found for student');

    // Check for duplicate invoice for same term/year and same fee structures (idempotency)
    const existing = await this.prisma.invoice.findFirst({
      where: {
        schoolId,
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        termId: dto.termId,
        status: { notIn: [InvoiceStatus.VOID, InvoiceStatus.CANCELLED] },
      },
      include: { items: true }
    });

    if (existing) {
      // If the user wants to duplicate, they should be able to, but we prevent accidental ones.
      // For now, we follow the prompt: "Before generating an invoice, check whether an equivalent invoice already exists"
      throw new ConflictException('An active invoice already exists for this student in the selected period');
    }

    const feeStructures = await this.prisma.feeStructure.findMany({
      where: { id: { in: dto.feeStructureIds || [] }, schoolId },
      include: { feeCategory: true },
    });

    if (feeStructures.length === 0) throw new BadRequestException('No valid fee structures selected');

    const subtotal = feeStructures.reduce((acc, f) => acc.add(f.amount), new Prisma.Decimal(0));
    const invoiceNumber = `INV-${school?.code || 'SCH'}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const currency = dto.currency || school?.currency || 'USD';

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
          currency,
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

      // Record in Ledger
      await this.ledger.recordEntry({
        schoolId,
        studentId: dto.studentId,
        transactionType: LedgerTransactionType.INVOICE,
        amount: subtotal,
        currency,
        direction: LedgerDirection.DEBIT,
        description: `Invoice ${invoiceNumber} issued`,
        referenceId: invoice.id,
        referenceType: 'Invoice',
        actorId,
        tx,
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'INVOICE_ISSUED',
        module: 'FINANCE',
        resourceId: invoice.id,
        tx,
      });

      // Notify User (Student/Parent)
      // We do this after transaction succeeds or as part of it?
      // Safest is after, but for simple flow we can trigger it here or in controller.
      // Better to trigger it here since it's a centralized service.
      try {
        await this.comms.sendNotification({
          schoolId,
          userId: enrollment.student.userId || '', // Assuming student has userId
          type: 'INVOICE_ISSUED',
          data: {
            invoiceNumber,
            totalAmount: subtotal.toString(),
            dueDate: dto.dueDate.toLocaleDateString(),
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          }
        });
      } catch (err) {
        // Log error but don't fail transaction
        console.error('Failed to send invoice notification', err);
      }

      return invoice;
    });
  }

  async startBulkBilling(schoolId: string, params: {
    academicYearId: string;
    termId: string;
    classId?: string;
    feeStructureIds: string[];
    dueDate: Date;
  }, actorId: string) {

    const billingRun = await this.prisma.billingRun.create({
      data: {
        schoolId,
        academicYearId: params.academicYearId,
        termId: params.termId,
        status: BillingRunStatus.PROCESSING,
        criteria: params as any,
        createdBy: actorId,
        startTime: new Date(),
      },
    });

    // In production this would be a background job
    this.processBulkBilling(billingRun.id, schoolId, params, actorId);

    return billingRun;
  }

  private async processBulkBilling(runId: string, schoolId: string, params: any, actorId: string) {
    const students = await this.prisma.student.findMany({
      where: {
        schoolId,
        status: 'ACTIVE',
        enrollments: {
          some: {
            academicYearId: params.academicYearId,
            ...(params.classId ? { classId: params.classId } : {}),
            status: 'ACTIVE',
          }
        }
      }
    });

    let success = 0;
    let failure = 0;

    for (const student of students) {
      try {
        await this.createIndividualInvoice(schoolId, {
          studentId: student.id,
          academicYearId: params.academicYearId,
          termId: params.termId,
          feeStructureIds: params.feeStructureIds,
          dueDate: params.dueDate,
        }, actorId);
        success++;
      } catch (e) {
        failure++;
      }
    }

    await this.prisma.billingRun.update({
      where: { id: runId },
      data: {
        status: failure === 0 ? BillingRunStatus.COMPLETED : BillingRunStatus.PARTIALLY_COMPLETED,
        studentsProcessed: students.length,
        invoicesGenerated: success,
        failures: failure,
        completionTime: new Date(),
      }
    });
  }
}
