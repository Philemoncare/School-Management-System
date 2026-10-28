import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics.service';

@Processor('reports')
@Injectable()
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
      private prisma: PrismaService,
      private analyticsService: AnalyticsService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { executionId, scheduleId } = job.data;

    if (job.name === 'periodic-snapshots') {
        return this.analyticsService.runPeriodicSnapshots();
    }

    if (scheduleId) {
        return this.processScheduledReport(scheduleId);
    }

    const execution = await this.prisma.reportExecution.findUnique({
      where: { id: executionId },
      include: {
          reportDefinition: { include: { dataset: true } },
          reportVersion: true
      }
    });

    if (!execution) return;

    try {
      await this.prisma.reportExecution.update({
        where: { id: executionId },
        data: { status: 'PROCESSING' }
      });

      const startTime = Date.now();

      // 1. Fetch data based on definition code and parameters
      const data = await this.fetchReportData(execution);

      // 2. Format and Generate File (In production this uses exceljs / jspdf)
      const fileUrl = await this.generateFile(execution, data);

      const endTime = Date.now();

      await this.prisma.reportExecution.update({
        where: { id: executionId },
        data: {
          status: 'COMPLETED',
          fileUrl,
          durationMs: endTime - startTime,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

    } catch (error) {
      this.logger.error(`Failed to process report ${executionId}: ${error.message}`);
      await this.prisma.reportExecution.update({
        where: { id: executionId },
        data: { status: 'FAILED', error: error.message }
      });
    }
  }

  private async processScheduledReport(scheduleId: string) {
      const schedule = await this.prisma.reportSchedule.findUnique({
          where: { id: scheduleId },
          include: { reportDefinition: true }
      });

      if (!schedule || !schedule.isActive) return;

      // Create a new execution
      const execution = await this.prisma.reportExecution.create({
          data: {
              schoolId: schedule.schoolId,
              reportDefinitionId: schedule.reportDefinitionId,
              executedById: schedule.createdById,
              parameters: schedule.parameters as any,
              format: schedule.format,
              status: 'PENDING'
          }
      });

      // Recurse to process the new execution
      return this.process({ data: { executionId: execution.id } } as Job);
  }

  private async fetchReportData(execution: any) {
    const { reportDefinition, parameters, reportVersion } = execution;
    const { schoolId } = execution;
    const config = reportVersion?.config as any;

    // Apply basic school filtering to all queries
    const baseWhere = { schoolId };

    switch (reportDefinition.category) {
      case 'STUDENTS':
        return this.prisma.student.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            enrollments: {
              where: { status: 'ACTIVE' },
              include: { class: true, section: true },
              take: 1
            },
            guardians: { include: { guardian: true } }
          },
          orderBy: { lastName: 'asc' }
        });

      case 'FINANCE':
        return this.prisma.invoice.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            student: { select: { firstName: true, lastName: true, studentNumber: true } },
            items: { include: { feeCategory: true } },
            allocations: { include: { payment: true } }
          },
          orderBy: { issueDate: 'desc' }
        });

      case 'ATTENDANCE':
        return this.prisma.studentAttendance.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            student: { select: { firstName: true, lastName: true, studentNumber: true } },
            session: { include: { class: true, subject: true } }
          },
          orderBy: { session: { date: 'desc' } }
        });

      case 'RESULTS':
        return this.prisma.subjectResult.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            student: { select: { firstName: true, lastName: true, studentNumber: true } },
            subject: true,
            class: true,
            term: true
          },
          orderBy: [{ classId: 'asc' }, { studentId: 'asc' }]
        });

      case 'ADMISSIONS':
        return this.prisma.admissionApplication.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            campaign: true,
            class: true,
            academicYear: true,
            documents: true
          },
          orderBy: { submissionDate: 'desc' }
        });

      case 'HR':
        return this.prisma.staff.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            department: true,
            position: true,
            employmentRecords: { where: { status: 'ACTIVE' }, take: 1 },
            user: { select: { email: true, phone: true } }
          }
        });

      case 'LIBRARY':
        return this.prisma.libraryLoan.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            bookCopy: { include: { book: { include: { category: true } } } },
            membership: { include: { user: { select: { firstName: true, lastName: true } } } }
          },
          orderBy: { dueDate: 'asc' }
        });

      case 'TRANSPORT':
        return this.prisma.transportAssignment.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            student: { select: { firstName: true, lastName: true } },
            route: { include: { stops: true } },
            pickupStop: true,
            dropoffStop: true
          }
        });

      case 'COMMUNICATION':
        return this.prisma.notification.findMany({
          where: { ...baseWhere, ...parameters },
          include: {
            user: { select: { firstName: true, lastName: true } },
            deliveries: true
          },
          orderBy: { createdAt: 'desc' }
        });

      case 'SUBSCRIPTIONS':
        // This is usually platform-wide, but if scoped to school:
        return this.prisma.schoolSubscription.findMany({
          where: { schoolId: baseWhere.schoolId },
          include: { plan: true, pricing: true, invoices: true }
        });

      default:
        if (reportDefinition.dataset) {
          return this.fetchDatasetData(reportDefinition.dataset, schoolId, parameters, config);
        }
        return [];
    }
  }

  private async fetchDatasetData(dataset: any, schoolId: string, parameters: any, config: any) {
    const modelName = dataset.baseModel;
    const prismaModel = (this.prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];

    if (!prismaModel) {
        this.logger.error(`Model ${modelName} not found on PrismaService`);
        return [];
    }

    const { columns, sortBy, sortOrder, limit } = config || {};

    // Basic selection if columns are specified
    const select = columns?.reduce((acc: any, col: string) => {
        acc[col] = true;
        return acc;
    }, {});

    return prismaModel.findMany({
        where: { schoolId, ...parameters },
        select: select && Object.keys(select).length > 0 ? select : undefined,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined,
        take: limit || 1000
    });
  }

  private async generateFile(execution: any, data: any[]) {
      // In production, this would use a PDF/Excel library and upload to S3/Cloud Storage
      // For this implementation, we return a mock URL
      return `https://storage.schoolerp.com/reports/${execution.schoolId}/${execution.id}.${execution.format.toLowerCase()}`;
  }
}

