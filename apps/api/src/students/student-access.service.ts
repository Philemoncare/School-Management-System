import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentAccessService {
  constructor(private prisma: PrismaService) {}

  async getStudentProfile(userId: string, schoolId: string) {
    const student = await this.prisma.student.findFirst({
      where: { userId, schoolId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            class: true,
            section: true,
            academicYear: true,
            term: true,
          },
          take: 1,
        },
      },
    });

    if (!student) {
      throw new ForbiddenException('No active student profile found for this school context.');
    }

    return student;
  }

  async validateStudentOwnership(userId: string, schoolId: string, targetStudentId: string) {
    const student = await this.getStudentProfile(userId, schoolId);
    if (student.id !== targetStudentId) {
      throw new ForbiddenException('Access denied. You can only access your own student records.');
    }
    return student;
  }
}
