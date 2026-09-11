import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportCardService {
  constructor(private prisma: PrismaService) {}

  async getReportCard(studentId: string, academicYearId: string, termId?: string) {
    return this.prisma.reportCard.findUnique({
      where: {
        studentId_academicYearId_termId: {
          studentId,
          academicYearId,
          termId: termId || null
        }
      },
      include: {
        student: true,
        academicYear: true,
        term: true,
        class: true,
        subjectSnapshots: {
          include: { subject: true }
        }
      }
    });
  }
}
