import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ResultCalculationService } from './result-calculation.service';
import { CreateExamPeriodDto, CreateExamSessionDto, MarkExamAttendanceDto } from './dto/examination.dto';
import { CreateGradingScaleDto, CreateGradingPolicyDto } from './dto/grading.dto';
import { GenerateReportCardsDto } from './dto/report-card.dto';
import { ResultStatus, ExamPeriodStatus } from '@prisma/client';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';

@Injectable()
export class ResultsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private calculation: ResultCalculationService,
    private outbox: OutboxService,
  ) {}

  // Examination Periods
  async createExamPeriod(schoolId: string, dto: CreateExamPeriodDto, actorId: string) {
    const period = await this.prisma.examinationPeriod.create({
      data: { ...dto, schoolId }
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'EXAM_PERIOD_CREATED',
      module: 'EXAMINATIONS',
      resourceId: period.id,
    });

    return period;
  }

  async findAllExamPeriods(schoolId: string) {
    return this.prisma.examinationPeriod.findMany({
      where: { schoolId },
      include: { academicYear: true, term: true },
      orderBy: { startDate: 'desc' }
    });
  }

  // Examination Sessions
  async createExamSession(schoolId: string, dto: CreateExamSessionDto, actorId: string) {
    const session = await this.prisma.examinationSession.create({
      data: dto
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'EXAM_SESSION_CREATED',
      module: 'EXAMINATIONS',
      resourceId: session.id,
    });

    return session;
  }

  // Result Management
  async calculateResultsForClass(schoolId: string, classId: string, academicYearId: string, termId?: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { schoolId, classId, academicYearId, termId, status: 'ACTIVE' }
    });

    const subjects = await this.prisma.classSubject.findMany({
      where: { classId }
    });

    for (const enrollment of enrollments) {
      for (const subject of subjects) {
        await this.calculation.calculateSubjectResult(enrollment.id, subject.subjectId);
      }
      await this.calculation.calculateOverallResult(enrollment.id);
    }

    await this.calculation.rankStudents(classId, academicYearId, termId);

    return { message: `Results calculated for ${enrollments.length} students` };
  }

  async publishResults(schoolId: string, classId: string, academicYearId: string, termId?: string, actorId?: string) {
    await this.prisma.subjectResult.updateMany({
      where: { schoolId, classId, academicYearId, termId },
      data: { status: ResultStatus.PUBLISHED, publishedAt: new Date() }
    });

    await this.prisma.overallResult.updateMany({
      where: { schoolId, classId, academicYearId, termId },
      data: { status: ResultStatus.PUBLISHED, publishedAt: new Date() }
    });

    await this.outbox.dispatch(
      new DomainEvent(
        'RESULT_PUBLISHED',
        'CLASS',
        classId,
        { classId, academicYearId, termId },
        schoolId,
        actorId
      )
    );

    return { message: 'Results published successfully' };
  }

  // Report Cards
  async generateReportCards(schoolId: string, dto: GenerateReportCardsDto, actorId: string) {
    const { classId, academicYearId, termId, studentIds } = dto;

    const where: any = { schoolId, classId, academicYearId, termId, status: 'PUBLISHED' };
    if (studentIds) where.studentId = { in: studentIds };

    const overallResults = await this.prisma.overallResult.findMany({
      where,
      include: {
        student: true,
        enrollment: {
          include: {
            subjectResults: {
              where: { status: 'PUBLISHED' },
              include: { subject: true }
            }
          }
        }
      }
    });

    for (const res of overallResults) {
      await this.prisma.reportCard.upsert({
        where: { studentId_academicYearId_termId: { studentId: res.studentId, academicYearId: res.academicYearId, termId: res.termId } },
        update: {
          overallScore: res.totalScore,
          averagePercentage: res.averagePercentage,
          gpa: res.averageGradePoint,
          rank: res.position,
          status: 'GENERATED'
        },
        create: {
          schoolId,
          studentId: res.studentId,
          academicYearId: res.academicYearId,
          termId: res.termId,
          classId: res.classId,
          overallScore: res.totalScore,
          averagePercentage: res.averagePercentage,
          gpa: res.averageGradePoint,
          rank: res.position,
          status: 'GENERATED'
        }
      });

      // Take snapshots
      const reportCard = await this.prisma.reportCard.findFirst({
        where: { studentId: res.studentId, academicYearId: res.academicYearId, termId: res.termId }
      });

      if (reportCard) {
        for (const subRes of res.enrollment.subjectResults) {
          await this.prisma.reportCardSubjectResultSnapshot.upsert({
            where: { reportCardId_subjectId: { reportCardId: reportCard.id, subjectId: subRes.subjectId } },
            update: {
              score: subRes.percentage,
              grade: subRes.grade,
              gradePoint: subRes.gradePoint,
            },
            create: {
              reportCardId: reportCard.id,
              subjectId: subRes.subjectId,
              score: subRes.percentage,
              grade: subRes.grade,
              gradePoint: subRes.gradePoint,
            }
          });
        }
      }
    }

    return { message: `${overallResults.length} report cards generated` };
  }

  // Student/Guardian Portal
  async getStudentResults(schoolId: string, studentId: string, academicYearId?: string, termId?: string) {
    return this.prisma.overallResult.findMany({
      where: { schoolId, studentId, academicYearId, termId, status: ResultStatus.PUBLISHED },
      include: {
        enrollment: {
          include: {
            subjectResults: {
              where: { status: ResultStatus.PUBLISHED },
              include: { subject: true }
            }
          }
        }
      }
    });
  }
}
