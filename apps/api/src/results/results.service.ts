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
  async publishReportCards(
    schoolId: string,
    filters: { classId?: string; academicYearId?: string; termId?: string },
    actorId?: string,
  ) {
    const { classId, academicYearId, termId } = filters || {};
    const where: any = { schoolId, status: 'GENERATED' };
    if (classId) where.classId = classId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (termId) where.termId = termId;

    const publishedAt = new Date();
    const result = await this.prisma.reportCard.updateMany({
      where,
      data: { status: 'PUBLISHED', publishedAt },
    });

    if (result.count > 0) {
      await this.outbox.dispatch(
        new DomainEvent(
          'REPORT_CARDS_PUBLISHED',
          'CLASS',
          classId || schoolId,
          { classId, academicYearId, termId, count: result.count },
          schoolId,
          actorId,
        ),
      );
    }

    return {
      published: result.count,
      message:
        result.count > 0
          ? `${result.count} report card${result.count === 1 ? '' : 's'} published`
          : 'No generated report cards matched this batch',
    };
  }

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

  // Report card archive
  async findReportCards(schoolId: string, filters: any = {}) {
    const where: any = { schoolId };
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.termId) where.termId = filters.termId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.status) where.status = filters.status;

    return this.prisma.reportCard.findMany({
      where,
      include: {
        student: true,
        class: true,
        academicYear: true,
        term: true,
        subjectSnapshots: { include: { subject: true } },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 500,
    });
  }

  /**
   * Publication history grouped by year/term/class, computed from the real
   * report card records so the archive reflects what was actually published.
   */
  async getResultsHistory(schoolId: string, filters: any = {}) {
    const where: any = { schoolId };
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;

    const cards = await this.prisma.reportCard.findMany({
      where,
      include: { academicYear: true, term: true, class: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    const groups = new Map<string, any>();
    for (const card of cards) {
      const key = `${card.academicYearId}:${card.termId || 'none'}:${card.classId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          academicYear: card.academicYear,
          term: card.term,
          class: card.class,
          totalStudents: 0,
          published: 0,
          generated: 0,
          draft: 0,
          lastPublishedAt: null as Date | null,
        });
      }
      const group = groups.get(key);
      group.totalStudents += 1;
      if (card.status === 'PUBLISHED') group.published += 1;
      else if (card.status === 'GENERATED') group.generated += 1;
      else if (card.status === 'DRAFT') group.draft += 1;
      if (card.publishedAt && (!group.lastPublishedAt || card.publishedAt > group.lastPublishedAt)) {
        group.lastPublishedAt = card.publishedAt;
      }
    }

    return [...groups.values()].sort((a, b) => {
      const at = a.lastPublishedAt ? new Date(a.lastPublishedAt).getTime() : 0;
      const bt = b.lastPublishedAt ? new Date(b.lastPublishedAt).getTime() : 0;
      return bt - at;
    });
  }

  // Individual subject results (used to pick a record for correction)
  async findSubjectResults(schoolId: string, filters: any = {}) {
    const where: any = { schoolId };
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.termId) where.termId = filters.termId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.search) {
      where.OR = [
        { student: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { student: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { student: { studentNumber: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.subjectResult.findMany({
      where,
      include: { student: true, subject: true, class: true, term: true },
      orderBy: [{ student: { lastName: 'asc' } }, { subject: { name: 'asc' } }],
      take: 500,
    });
  }

  async findCorrectionRequests(schoolId: string, filters: any = {}) {
    const where: any = { schoolId };
    if (filters.status) where.status = filters.status;

    return this.prisma.resultCorrectionRequest.findMany({
      where,
      include: {
        student: true,
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        subjectResult: { include: { subject: true, class: true, term: true, academicYear: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
  }

  async createCorrectionRequest(
    schoolId: string,
    dto: { subjectResultId: string; newScore: number; reason: string },
    actorId: string,
  ) {
    if (!dto?.subjectResultId) throw new BadRequestException('subjectResultId is required');
    const newScore = Number(dto.newScore);
    if (!Number.isFinite(newScore) || newScore < 0 || newScore > 100) {
      throw new BadRequestException('newScore must be between 0 and 100');
    }
    if (!dto.reason || dto.reason.trim().length < 5) {
      throw new BadRequestException('A reason of at least 5 characters is required');
    }

    const subjectResult = await this.prisma.subjectResult.findFirst({
      where: { id: dto.subjectResultId, schoolId },
      include: { student: true, subject: true },
    });
    if (!subjectResult) throw new NotFoundException('Subject result not found');

    const openRequest = await this.prisma.resultCorrectionRequest.findFirst({
      where: { subjectResultId: subjectResult.id, status: 'PENDING' },
    });
    if (openRequest) throw new BadRequestException('This result already has a pending correction request');

    if (Math.abs(subjectResult.percentage - newScore) < 0.01) {
      throw new BadRequestException('The corrected score must differ from the current score');
    }

    const request = await this.prisma.resultCorrectionRequest.create({
      data: {
        schoolId,
        subjectResultId: subjectResult.id,
        studentId: subjectResult.studentId,
        requestedById: actorId,
        reason: dto.reason.trim(),
        previousScore: subjectResult.percentage,
        newScore,
        status: 'PENDING',
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'RESULT_CORRECTION_REQUESTED',
      module: 'RESULTS',
      resourceId: request.id,
      metadata: {
        subjectResultId: subjectResult.id,
        studentId: subjectResult.studentId,
        subject: subjectResult.subject?.name,
        previousScore: subjectResult.percentage,
        newScore,
      },
    });

    return request;
  }

  private async resolveGrade(schoolId: string, percentage: number) {
    const gradingScale = await this.prisma.gradingScale.findFirst({
      where: { schoolId, status: true },
      include: { gradeBands: { orderBy: { minimumPercentage: 'desc' } } },
    });

    let grade = 'F';
    let gradePoint = 0;
    let remark = 'Fail';
    if (gradingScale) {
      for (const band of gradingScale.gradeBands) {
        if (percentage >= band.minimumPercentage) {
          grade = band.grade;
          gradePoint = band.gradePoint || 0;
          remark = band.remark || '';
          break;
        }
      }
    }
    return { grade, gradePoint, remark };
  }

  async approveCorrectionRequest(schoolId: string, id: string, actorId: string) {
    const request = await this.prisma.resultCorrectionRequest.findFirst({
      where: { id, schoolId },
      include: { subjectResult: true },
    });
    if (!request) throw new NotFoundException('Correction request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request is already processed');

    const { grade, gradePoint, remark } = await this.resolveGrade(schoolId, request.newScore);

    await this.prisma.subjectResult.update({
      where: { id: request.subjectResultId },
      data: {
        percentage: request.newScore,
        weightedScore: request.newScore,
        grade,
        gradePoint,
        remark,
      },
    });

    await this.calculation.calculateOverallResult(request.subjectResult.enrollmentId);
    await this.calculation.rankStudents(
      request.subjectResult.classId,
      request.subjectResult.academicYearId,
      request.subjectResult.termId || undefined,
    );

    // Keep any generated report card snapshot consistent with the correction.
    const card = await this.prisma.reportCard.findFirst({
      where: {
        schoolId,
        studentId: request.studentId,
        academicYearId: request.subjectResult.academicYearId,
        termId: request.subjectResult.termId,
      },
    });
    if (card) {
      await this.prisma.reportCardSubjectResultSnapshot.upsert({
        where: {
          reportCardId_subjectId: {
            reportCardId: card.id,
            subjectId: request.subjectResult.subjectId,
          },
        },
        update: { score: request.newScore, grade, gradePoint },
        create: {
          reportCardId: card.id,
          subjectId: request.subjectResult.subjectId,
          score: request.newScore,
          grade,
          gradePoint,
        },
      });
    }

    const updated = await this.prisma.resultCorrectionRequest.update({
      where: { id },
      data: { status: 'IMPLEMENTED', reviewedById: actorId, reviewedAt: new Date() },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'RESULT_CORRECTION_APPROVED',
      module: 'RESULTS',
      resourceId: id,
      metadata: {
        subjectResultId: request.subjectResultId,
        previousScore: request.previousScore,
        newScore: request.newScore,
      },
    });

    return updated;
  }

  async rejectCorrectionRequest(schoolId: string, id: string, actorId: string, comments?: string) {
    const request = await this.prisma.resultCorrectionRequest.findFirst({ where: { id, schoolId } });
    if (!request) throw new NotFoundException('Correction request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Request is already processed');

    const updated = await this.prisma.resultCorrectionRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedById: actorId, reviewedAt: new Date() },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'RESULT_CORRECTION_REJECTED',
      module: 'RESULTS',
      resourceId: id,
      metadata: { comments: comments || null },
    });

    return updated;
  }
}
