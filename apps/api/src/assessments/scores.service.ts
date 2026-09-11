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

        const score = await tx.studentAssessmentScore.upsert({
          where: {
            assessmentId_assessmentComponentId_studentId: {
              assessmentId,
              assessmentComponentId: null as any,
              studentId: scoreDto.studentId,
            },
          },
          update: {
            rawScore: scoreDto.rawScore,
            maximumScore: assessment.totalMarks,
            percentage,
            status: scoreDto.status || ScoreStatus.SUBMITTED,
            remarks: scoreDto.remarks,
            updatedBy: actorId,
          },
          create: {
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
