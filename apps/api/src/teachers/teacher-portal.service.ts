import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
      this.prisma.messageReadStatus.count({
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

  async getReportsSummary(userId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: { select: { id: true, name: true } },
        section: { include: { class: { select: { id: true, name: true } } } },
      },
    });

    const sectionIds = Array.from(new Set(assignments.map((item) => item.sectionId)));

    const [enrollments, sessions, classAssignments, assessments] = await Promise.all([
      this.prisma.enrollment.groupBy({
        by: ['sectionId'],
        where: { schoolId, sectionId: { in: sectionIds }, status: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.attendanceSession.findMany({
        where: { schoolId, sectionId: { in: sectionIds } },
        select: {
          sectionId: true,
          records: { select: { status: true } },
        },
      }),
      this.prisma.classAssignment.groupBy({
        by: ['sectionId'],
        where: { schoolId, teacherId: teacher.id, sectionId: { in: sectionIds } },
        _count: { _all: true },
      }),
      this.prisma.assessment.count({
        where: {
          schoolId,
          subjectId: { in: assignments.map((item) => item.subjectId) },
          status: { in: [AssessmentStatus.DRAFT, AssessmentStatus.SUBMISSION_OPEN] },
        },
      }),
    ]);

    const classRows = sectionIds.map((sectionId) => {
      const sectionAssignments = assignments.filter((item) => item.sectionId === sectionId);
      const sectionSessions = sessions.filter((item) => item.sectionId === sectionId);
      const statuses = sectionSessions.flatMap((session) => session.records.map((record) => record.status));
      const present = statuses.filter((status) => status === 'PRESENT').length;
      const late = statuses.filter((status) => status === 'LATE').length;
      const absent = statuses.filter((status) => status === 'ABSENT').length;
      const totalRecords = statuses.length;

      return {
        sectionId,
        className: sectionAssignments[0]?.section.class.name || 'Unknown class',
        sectionName: sectionAssignments[0]?.section.name || '',
        subjects: sectionAssignments.map((item) => item.subject.name),
        students: enrollments.find((item) => item.sectionId === sectionId)?._count._all || 0,
        attendanceRate: totalRecords > 0 ? Number((((present + late) / totalRecords) * 100).toFixed(1)) : null,
        present,
        absent,
        late,
        assignments: classAssignments.find((item) => item.sectionId === sectionId)?._count._all || 0,
      };
    });

    const totalStudents = enrollments.reduce((sum, item) => sum + item._count._all, 0);
    const allStatuses = sessions.flatMap((session) => session.records.map((record) => record.status));
    const presentLike = allStatuses.filter((status) => status === 'PRESENT' || status === 'LATE').length;

    return {
      stats: {
        classes: sectionIds.length,
        subjects: new Set(assignments.map((item) => item.subjectId)).size,
        students: totalStudents,
        assignments: classAssignments.reduce((sum, item) => sum + item._count._all, 0),
        pendingAssessments: assessments,
        attendanceRate: allStatuses.length > 0 ? Number(((presentLike / allStatuses.length) * 100).toFixed(1)) : null,
      },
      classes: classRows,
    };
  }

  async getClassAssignments(userId: string, schoolId: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    return this.prisma.classAssignment.findMany({
      where: { teacherId: teacher.id, schoolId },
      include: {
        class: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, name: true, code: true } },
        term: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createClassAssignment(userId: string, schoolId: string, dto: any) {
    const teacher = await this.prisma.teacher.findFirst({ where: { userId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');

    const title = typeof dto.title === 'string' ? dto.title.trim() : '';
    const description = typeof dto.description === 'string' ? dto.description.trim() : '';
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    if (!dto.teacherAssignmentId) {
      throw new BadRequestException('Select one of your teaching assignments.');
    }
    if (!title || !description) {
      throw new BadRequestException('Title and instructions are required.');
    }
    if (!dueDate || Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Enter a valid due date.');
    }

    const teachingAssignment = await this.prisma.teacherAssignment.findFirst({
      where: { id: dto.teacherAssignmentId, teacherId: teacher.id },
      include: { section: { select: { classId: true } } },
    });
    if (!teachingAssignment) {
      throw new NotFoundException('Teaching assignment not found.');
    }

    return this.prisma.classAssignment.create({
      data: {
        schoolId,
        academicYearId: teachingAssignment.academicYearId,
        termId: teachingAssignment.termId,
        teacherId: teacher.id,
        classId: teachingAssignment.section.classId,
        sectionId: teachingAssignment.sectionId,
        subjectId: teachingAssignment.subjectId,
        title,
        description,
        dueDate,
        status: 'PUBLISHED',
      },
      include: {
        class: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { submissions: true } },
      },
    });
  }
}
