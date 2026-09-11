import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateRoomDto,
  CreateBellScheduleDto,
  CreateTimetableEntryDto,
  CreateTimetableVersionDto,
  CreateSubstitutionDto,
  CreateCalendarEventDto
} from './dto/timetable.dto';
import { TimetableStatus, EntryStatus, SubstitutionStatus, Prisma } from '@prisma/client';

@Injectable()
export class TimetableService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Rooms
  async createRoom(schoolId: string, dto: CreateRoomDto, actorId: string) {
    const room = await this.prisma.room.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ROOM_CREATED',
      module: 'TIMETABLE',
      resourceId: room.id,
      metadata: { name: dto.name, code: dto.code }
    });

    return room;
  }

  async findAllRooms(schoolId: string) {
    return this.prisma.room.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  // Bell Schedules & Periods
  async createBellSchedule(schoolId: string, dto: CreateBellScheduleDto, actorId: string) {
    const { periods, ...data } = dto;
    return this.prisma.bellSchedule.create({
      data: {
        ...data,
        schoolId,
        periods: {
          create: periods
        }
      },
      include: { periods: true }
    });
  }

  async findAllBellSchedules(schoolId: string) {
    return this.prisma.bellSchedule.findMany({
      where: { schoolId },
      include: { periods: { orderBy: { periodNumber: 'asc' } } }
    });
  }

  // Timetable Entries & Conflict Detection
  async createTimetableEntry(schoolId: string, dto: CreateTimetableEntryDto, actorId: string) {
    // 1. Check for conflicts
    const conflicts = await this.checkConflicts(schoolId, dto);
    if (conflicts.length > 0) {
      throw new ConflictException({
        message: 'Scheduling conflicts detected',
        conflicts
      });
    }

    // 2. Create entry
    const entry = await this.prisma.timetableEntry.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TIMETABLE_ENTRY_CREATED',
      module: 'TIMETABLE',
      resourceId: entry.id,
    });

    return entry;
  }

  async checkConflicts(schoolId: string, dto: CreateTimetableEntryDto, excludeId?: string) {
    const { dayOfWeek, periodId, startTime, endTime, teacherId, classId, sectionId, roomId } = dto;
    const conflicts: any[] = [];

    // Base filters for overlapping time
    const timeOverlap: Prisma.TimetableEntryWhereInput = periodId
      ? { periodId }
      : {
          OR: [
            { startTime: { lte: startTime }, endTime: { gt: startTime } },
            { startTime: { lt: endTime }, endTime: { gte: endTime } },
            { startTime: { gte: startTime }, endTime: { lte: endTime } }
          ]
        };

    const commonWhere: Prisma.TimetableEntryWhereInput = {
      schoolId,
      dayOfWeek,
      id: excludeId ? { not: excludeId } : undefined,
      status: { notIn: [EntryStatus.CANCELLED, EntryStatus.REPLACED] },
      ...timeOverlap
    };

    // Teacher Conflict
    const teacherConflict = await this.prisma.timetableEntry.findFirst({
      where: { ...commonWhere, teacherId },
      include: { subject: true, class: true }
    });
    if (teacherConflict) {
      conflicts.push({
        type: 'TEACHER_CONFLICT',
        message: `Teacher is already scheduled for ${teacherConflict.subject.name} with ${teacherConflict.class.name}`,
        existingEntry: teacherConflict
      });
    }

    // Class/Section Conflict
    const classConflict = await this.prisma.timetableEntry.findFirst({
      where: {
        ...commonWhere,
        classId,
        sectionId: sectionId || null
      },
      include: { subject: true, teacher: true }
    });
    if (classConflict) {
      conflicts.push({
        type: 'CLASS_CONFLICT',
        message: `Class is already scheduled for ${classConflict.subject.name} with ${classConflict.teacher.firstName}`,
        existingEntry: classConflict
      });
    }

    // Room Conflict
    if (roomId) {
      const roomConflict = await this.prisma.timetableEntry.findFirst({
        where: { ...commonWhere, roomId },
        include: { subject: true, class: true }
      });
      if (roomConflict) {
        conflicts.push({
          type: 'ROOM_CONFLICT',
          message: `Room is already occupied by ${roomConflict.class.name} for ${roomConflict.subject.name}`,
          existingEntry: roomConflict
        });
      }
    }

    return conflicts;
  }

  async findAllEntries(schoolId: string, filters: any = {}) {
    return this.prisma.timetableEntry.findMany({
      where: { ...filters, schoolId },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: true,
        room: true,
        period: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: { periodNumber: 'asc' } },
        { startTime: 'asc' }
      ]
    });
  }

  // Substitutions
  async createSubstitution(schoolId: string, dto: CreateSubstitutionDto, actorId: string) {
    // Validate availability of substitute
    const entry = await this.prisma.timetableEntry.findUnique({
      where: { id: dto.timetableEntryId },
      include: { period: true }
    });
    if (!entry) throw new NotFoundException('Timetable entry not found');

    const conflicts = await this.checkConflicts(schoolId, {
      ...entry,
      teacherId: dto.substituteTeacherId,
      // We check for this specific date, so we'd need to extend checkConflicts to handle dates if needed
      // or just check against general timetable for that dayOfWeek
    } as any);

    if (conflicts.length > 0) {
       throw new ConflictException('Substitute teacher has a conflict at this time');
    }

    const sub = await this.prisma.teacherSubstitution.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TEACHER_SUBSTITUTION_CREATED',
      module: 'TIMETABLE',
      resourceId: sub.id,
    });

    return sub;
  }

  // Calendar
  async createCalendarEvent(schoolId: string, dto: CreateCalendarEventDto, actorId: string) {
    return this.prisma.academicCalendar.create({
      data: { ...dto, schoolId }
    });
  }

  async getCalendar(schoolId: string, academicYearId: string) {
    return this.prisma.academicCalendar.findMany({
      where: { schoolId, academicYearId },
      orderBy: { startDate: 'asc' }
    });
  }

  // Dashboard Metrics
  async getDashboardMetrics(schoolId: string) {
    const [
      totalRooms,
      totalEntries,
      activeSubstitutions,
      currentCalendarEvents
    ] = await Promise.all([
      this.prisma.room.count({ where: { schoolId } }),
      this.prisma.timetableEntry.count({ where: { schoolId, status: EntryStatus.PUBLISHED } }),
      this.prisma.teacherSubstitution.count({ where: { schoolId, status: SubstitutionStatus.PENDING } }),
      this.prisma.academicCalendar.count({
        where: {
          schoolId,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      })
    ]);

    return {
      metrics: {
        totalRooms,
        totalEntries,
        activeSubstitutions,
        currentCalendarEvents
      }
    };
  }

  // Helpers for Portal Views
  async findStudentByUserId(schoolId: string, userId: string) {
    return this.prisma.student.findFirst({
      where: { schoolId, userId }
    });
  }

  async findCurrentEnrollment(studentId: string) {
    return this.prisma.enrollment.findFirst({
      where: { studentId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  }
}
