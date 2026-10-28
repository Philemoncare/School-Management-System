import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BulkEnterScoresDto, EnterScoreDto } from './dto/score.dto';
import { AssessmentStatus, ScoreStatus } from '@prisma/client';

@Injectable()
export class ScoresService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async getEligibleStudents(schoolId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, schoolId },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    return this.prisma.enrollment.findMany({
      where: {
        schoolId,
        academicYearId: assessment.academicYearId,
        classId: assessment.classId,
        sectionId: assessment.sectionId || undefined,
        status: 'ACTIVE',
      },
      include: {
        student: true,
      },
    });
  }

  async getScores(schoolId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, schoolId },
      include: {
        assessmentType: true,
        class: true,
        section: true,
        subject: true,
        term: true,
        academicYear: true,
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const [scores, eligible] = await Promise.all([
      this.prisma.studentAssessmentScore.findMany({
        where: { assessmentId, schoolId, assessmentComponentId: null },
        include: { student: true },
      }),
      this.prisma.enrollment.findMany({
        where: {
          schoolId,
          academicYearId: assessment.academicYearId,
          classId: assessment.classId,
          ...(assessment.sectionId ? { sectionId: assessment.sectionId } : {}),
          status: 'ACTIVE',
        },
        include: { student: true },
        orderBy: { student: { lastName: 'asc' } },
      }),
    ]);

    return {
      assessment,
      scores: scores.map((score) => ({
        id: score.id,
        studentId: score.studentId,
        rawScore: score.rawScore,
        maximumScore: score.maximumScore,
        percentage: score.percentage,
        status: score.status,
        remarks: score.remarks,
        student: score.student,
      })),
      students: eligible.map((enrollment) => ({
        enrollmentId: enrollment.id,
        student: enrollment.student,
      })),
    };
  }

  async bulkEnterScores(schoolId: string, assessmentId: string, dto: BulkEnterScoresDto, actorId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, schoolId },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    if (assessment.status === AssessmentStatus.LOCKED) {
      throw new ForbiddenException('Assessment is locked');
    }

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const scoreDto of dto.scores) {
        // 1. Verify enrollment
        const enrollment = await tx.enrollment.findFirst({
          where: {
            studentId: scoreDto.studentId,
            academicYearId: assessment.academicYearId,
            classId: assessment.classId,
            ...(assessment.sectionId ? { sectionId: assessment.sectionId } : {}),
            schoolId,
            status: 'ACTIVE',
          },
        });

        if (!enrollment) continue;

        // 2. Validate score range
        if (scoreDto.rawScore !== undefined && (scoreDto.rawScore < 0 || scoreDto.rawScore > assessment.totalMarks)) {
          throw new BadRequestException(`Score for student ${scoreDto.studentId} is out of range`);
        }

        const percentage = scoreDto.rawScore !== undefined
          ? (scoreDto.rawScore / assessment.totalMarks) * 100
          : null;

        const existing = await tx.studentAssessmentScore.findFirst({
          where: { assessmentId, studentId: scoreDto.studentId, assessmentComponentId: null },
          select: { id: true },
        });

        const score = existing
          ? await tx.studentAssessmentScore.update({
              where: { id: existing.id },
              data: {
                rawScore: scoreDto.rawScore ?? null,
                maximumScore: assessment.totalMarks,
                percentage,
                status: scoreDto.status || ScoreStatus.SUBMITTED,
                remarks: scoreDto.remarks,
                updatedBy: actorId,
              },
            })
          : await tx.studentAssessmentScore.create({
              data: {
                schoolId,
                assessmentId,
                studentId: scoreDto.studentId,
                enrollmentId: enrollment.id,
                rawScore: scoreDto.rawScore,
                maximumScore: assessment.totalMarks,
                percentage,
                status: scoreDto.status || ScoreStatus.SUBMITTED,
                remarks: scoreDto.remarks,
                enteredBy: actorId,
                enteredAt: new Date(),
              },
            });
        results.push(score);
      }

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'SCORES_BULK_ENTERED',
        module: 'ASSESSMENTS',
        resourceId: assessmentId,
        metadata: { count: results.length },
      });

      return results;
    });
  }
}
