import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AudienceType } from '@prisma/client';

export interface AudienceConfig {
  type: AudienceType;
  classId?: string;
  sectionId?: string;
  roleId?: string;
  departmentId?: string;
  transportId?: string;
  studentId?: string;
  guardianId?: string;
  academicYearId?: string;
}

@Injectable()
export class AudienceResolverService {
  private readonly logger = new Logger(AudienceResolverService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Resolves an audience configuration into a list of unique User IDs.
   */
  async resolve(schoolId: string, config: AudienceConfig): Promise<string[]> {
    this.logger.log(`Resolving audience for school ${schoolId}: ${JSON.stringify(config)}`);

    let userIds: string[] = [];

    switch (config.type) {
      case AudienceType.ALL:
        const allMembers = await this.prisma.schoolMembership.findMany({
          where: { schoolId, status: 'ACTIVE' },
          select: { userId: true },
        });
        userIds = allMembers.map(m => m.userId);
        break;

      case AudienceType.STUDENTS:
        const students = await this.prisma.student.findMany({
          where: { schoolId, userId: { not: null }, status: 'ACTIVE' },
          select: { userId: true },
        });
        userIds = students.map(s => s.userId as string);
        break;

      case AudienceType.PARENTS:
        const guardians = await this.prisma.guardian.findMany({
          where: {
            students: { some: { student: { schoolId } } },
            userId: { not: null }
          },
          select: { userId: true },
        });
        userIds = guardians.map(g => g.userId as string);
        break;

      case AudienceType.TEACHERS:
        const teachers = await this.prisma.teacher.findMany({
          where: { schoolId, userId: { not: null }, status: 'ACTIVE' },
          select: { userId: true },
        });
        userIds = teachers.map(t => t.userId as string);
        break;

      case AudienceType.STAFF:
        const staff = await this.prisma.staff.findMany({
          where: { schoolId, userId: { not: null }, status: 'ACTIVE' },
          select: { userId: true },
        });
        userIds = staff.map(s => s.userId as string);
        break;

      case AudienceType.CLASS:
        if (!config.classId) break;
        const classStudents = await this.prisma.enrollment.findMany({
          where: {
            schoolId,
            classId: config.classId,
            sectionId: config.sectionId,
            status: 'ACTIVE',
            student: { userId: { not: null } }
          },
          select: { student: { select: { userId: true } } },
        });
        userIds = classStudents.map(e => e.student.userId as string);
        break;

      case AudienceType.ROLE:
        if (!config.roleId) break;
        const roleUsers = await this.prisma.userRole.findMany({
          where: { schoolId, roleId: config.roleId },
          select: { userId: true },
        });
        userIds = roleUsers.map(r => r.userId);
        break;

      case AudienceType.DEPARTMENT:
        if (!config.departmentId) break;
        const deptStaff = await this.prisma.staff.findMany({
          where: { schoolId, departmentId: config.departmentId, userId: { not: null } },
          select: { userId: true },
        });
        const deptTeachers = await this.prisma.teacher.findMany({
          where: { schoolId, departmentId: config.departmentId, userId: { not: null } },
          select: { userId: true },
        });
        userIds = [
          ...deptStaff.map(s => s.userId as string),
          ...deptTeachers.map(t => t.userId as string)
        ];
        break;

      default:
        this.logger.warn(`Audience type ${config.type} not yet fully implemented or supported.`);
    }

    // Return unique IDs
    return Array.from(new Set(userIds));
  }
}
