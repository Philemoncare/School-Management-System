import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssessmentStatus } from '@prisma/client';

@Injectable()
export class TeacherPortalService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics(userId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    const [assignments, classesToday, unreadMessages, announcements] = await Promise.all([
      this.prisma.teacherAssignment.findMany({
        where: { teacherId: teacher.id },
        include: { section: { include: { class: true } }, subject: true }
      }),
      this.prisma.timetableEntry.findMany({
        where: { teacherId: teacher.id, dayOfWeek: new Date().getDay() || 7 }, // 1-7, 0 is Sunday
        include: { class: true, section: true, subject: true }
      }),
      this.prisma.messageRecipient.count({
        where: { userId, isRead: false }
      }),
      this.prisma.announcement.findMany({
        where: {
          schoolId,
          status: 'PUBLISHED',
          OR: [
            { audiences: { some: { audienceType: 'ALL' } } },
            { audiences: { some: { audienceType: 'TEACHERS' } } }
          ]
        },
        take: 3,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Unique student count across all assigned classes/sections
    const sectionIds = assignments.map(a => a.sectionId).filter(Boolean) as string[];
    const studentCount = await this.prisma.enrollment.count({
      where: { sectionId: { in: sectionIds }, status: 'ACTIVE' }
    });

    const pendingAssessments = await this.prisma.assessment.count({
      where: {
        schoolId,
        subjectId: { in: assignments.map(a => a.subjectId) },
        classId: { in: assignments.map(a => a.section.classId) },
        status: { in: [AssessmentStatus.DRAFT, AssessmentStatus.SUBMISSION_OPEN] }
      }
    });

    return {
      stats: {
        myClasses: assignments.length,
        myStudents: studentCount,
        pendingAssessments,
        todayClasses: classesToday.length,
        unreadMessages,
      },
      todaySchedule: classesToday,
      announcements,
    };
  }

  async getMyAssignments(userId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    return this.prisma.teacherAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: true,
        section: { include: { class: true } },
        academicYear: true,
        term: true,
      }
    });
  }

  async getMyStudents(userId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { teacherId: teacher.id }
    });

    const sectionIds = assignments.map(a => a.sectionId).filter(Boolean) as string[];

    return this.prisma.enrollment.findMany({
      where: { sectionId: { in: sectionIds }, status: 'ACTIVE' },
      include: {
        student: true,
        class: true,
        section: true,
      },
      orderBy: { student: { lastName: 'asc' } }
    });
  }

  async getMyTimetable(userId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    return this.prisma.timetableEntry.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        period: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: { periodNumber: 'asc' } },
        { startTime: 'asc' }
      ]
    });
  }
}
