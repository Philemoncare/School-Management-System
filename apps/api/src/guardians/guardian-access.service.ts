import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GuardianAccessService {
  constructor(private prisma: PrismaService) {}

  async canAccessStudent(userId: string, schoolId: string, studentId: string): Promise<boolean> {
    const guardian = await this.prisma.guardian.findUnique({
      where: { userId },
      include: {
        students: {
          where: {
            studentId,
            student: {
              schoolId,
            },
          },
        },
      },
    });

    if (!guardian || guardian.students.length === 0) {
      return false;
    }

    // Additional checks for membership status could go here
    const membership = await this.prisma.schoolMembership.findUnique({
      where: {
        schoolId_userId: {
          schoolId,
          userId,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return false;
    }

    return true;
  }

  async validateStudentAccess(userId: string, schoolId: string, studentId: string) {
    const hasAccess = await this.canAccessStudent(userId, schoolId, studentId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this student');
    }
  }

  async getAuthorizedStudents(userId: string, schoolId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { userId },
      include: {
        students: {
          where: {
            student: {
              schoolId,
            },
          },
          include: {
            student: {
              include: {
                enrollments: {
                  where: {
                    status: 'ACTIVE',
                  },
                  include: {
                    class: true,
                    section: true,
                    academicYear: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!guardian) return [];

    return guardian.students.map((sg) => ({
      ...sg.student,
      relation: sg.relation,
      isPrimary: sg.isPrimary,
    }));
  }
}
