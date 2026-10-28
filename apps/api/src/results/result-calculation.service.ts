import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreStatus, ResultStatus } from '@prisma/client';

@Injectable()
export class ResultCalculationService {
  constructor(private prisma: PrismaService) {}

  async calculateSubjectResult(enrollmentId: string, subjectId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: true }
    });

    if (!enrollment) throw new Error('Enrollment not found');

    // Fetch all assessments for this subject and class
    const assessments = await this.prisma.assessment.findMany({
      where: {
        schoolId: enrollment.schoolId,
        academicYearId: enrollment.academicYearId,
        termId: enrollment.termId,
        classId: enrollment.classId,
        subjectId,
        status: 'PUBLISHED'
      },
      include: {
        scores: {
          where: { studentId: enrollment.studentId }
        }
      }
    });

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const assessment of assessments) {
      const score = assessment.scores[0];
      if (!score || score.rawScore === null) continue;

      if (score.status === ScoreStatus.EXEMPTED) continue;

      const percentage = (score.rawScore / assessment.totalMarks) * 100;
      const weightedScore = (percentage * assessment.weight) / 100;

      totalWeightedScore += weightedScore;
      totalWeight += assessment.weight;
    }

    // Normalize if weights don't add up to 1 (or 100)
    const finalPercentage = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;

    // Determine Grade
    const gradingScale = await this.prisma.gradingScale.findFirst({
      where: { schoolId: enrollment.schoolId, status: true },
      include: { gradeBands: { orderBy: { minimumPercentage: 'desc' } } }
    });

    let grade = 'F';
    let gradePoint = 0;
    let remark = 'Fail';

    if (gradingScale) {
      for (const band of gradingScale.gradeBands) {
        if (finalPercentage >= band.minimumPercentage) {
          grade = band.grade;
          gradePoint = band.gradePoint || 0;
          remark = band.remark || '';
          break;
        }
      }
    }

    return this.prisma.subjectResult.upsert({
      where: { enrollmentId_subjectId: { enrollmentId, subjectId } },
      update: {
        weightedScore: totalWeightedScore,
        percentage: finalPercentage,
        grade,
        gradePoint,
        remark,
        status: ResultStatus.CALCULATED
      },
      create: {
        schoolId: enrollment.schoolId,
        academicYearId: enrollment.academicYearId,
        termId: enrollment.termId,
        enrollmentId,
        studentId: enrollment.studentId,
        subjectId,
        classId: enrollment.classId,
        weightedScore: totalWeightedScore,
        percentage: finalPercentage,
        grade,
        gradePoint,
        remark,
        status: ResultStatus.CALCULATED
      }
    });
  }

  async calculateOverallResult(enrollmentId: string) {
    const subjectResults = await this.prisma.subjectResult.findMany({
      where: { enrollmentId }
    });

    if (subjectResults.length === 0) return null;

    const totalScore = subjectResults.reduce((acc, curr) => acc + curr.percentage, 0);
    const averagePercentage = totalScore / subjectResults.length;
    const totalGradePoints = subjectResults.reduce((acc, curr) => acc + (curr.gradePoint || 0), 0);
    const averageGradePoint = totalGradePoints / subjectResults.length;

    const enrollment = await this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) return null;

    return this.prisma.overallResult.upsert({
      where: { enrollmentId_academicYearId_termId: { enrollmentId, academicYearId: enrollment.academicYearId, termId: enrollment.termId } },
      update: {
        totalScore,
        averagePercentage,
        totalGradePoints,
        averageGradePoint,
        status: ResultStatus.CALCULATED
      },
      create: {
        schoolId: enrollment.schoolId,
        academicYearId: enrollment.academicYearId,
        termId: enrollment.termId,
        enrollmentId,
        studentId: enrollment.studentId,
        classId: enrollment.classId,
        totalScore,
        averagePercentage,
        totalGradePoints,
        averageGradePoint,
        status: ResultStatus.CALCULATED
      }
    });
  }

  async rankStudents(classId: string, academicYearId: string, termId?: string) {
    const results = await this.prisma.overallResult.findMany({
      where: { classId, academicYearId, termId },
      orderBy: { averagePercentage: 'desc' }
    });

    for (let i = 0; i < results.length; i++) {
      await this.prisma.overallResult.update({
        where: { id: results[i].id },
        data: { position: i + 1, totalStudents: results.length }
      });
    }
  }
}
