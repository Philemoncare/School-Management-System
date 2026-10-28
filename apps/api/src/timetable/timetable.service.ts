import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

@Injectable()
export class TimetableService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Rooms
  async createRoom(schoolId: string, dto: CreateRoomDto, actorId: string) {
    const name = dto.name?.trim();
    const code = dto.code?.trim();
    if (!name || !code) {
      throw new BadRequestException('Room name and code are required.');
    }
    if (!Number.isInteger(dto.capacity) || dto.capacity < 1) {
      throw new BadRequestException('Room capacity must be at least 1.');
    }
    const duplicate = await this.prisma.room.findFirst({
      where: { schoolId, code: { equals: code, mode: 'insensitive' } },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('A room with this code already exists.');
    }

    const room = await this.prisma.room.create({
      data: { ...dto, name, code, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ROOM_CREATED',
      module: 'TIMETABLE',
      resourceId: room.id,
      metadata: { name: room.name, code: room.code }
    });

    return room;
  }

  async updateRoom(schoolId: string, id: string, dto: Partial<CreateRoomDto> & { status?: boolean }, actorId: string) {
    const existing = await this.prisma.room.findFirst({ where: { id, schoolId } });
    if (!existing) {
      throw new NotFoundException('Room not found.');
    }

    const name = dto.name !== undefined ? dto.name.trim() : existing.name;
    const code = dto.code !== undefined ? dto.code.trim() : existing.code;
    if (!name || !code) {
      throw new BadRequestException('Room name and code are required.');
    }
    if (dto.capacity !== undefined && (!Number.isInteger(dto.capacity) || dto.capacity < 1)) {
      throw new BadRequestException('Room capacity must be at least 1.');
    }
    const duplicate = await this.prisma.room.findFirst({
      where: {
        schoolId,
        code: { equals: code, mode: 'insensitive' },
        NOT: { id },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('A room with this code already exists.');
    }

    const room = await this.prisma.room.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name } : {}),
        ...(dto.code !== undefined ? { code } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.building !== undefined ? { building: dto.building?.trim() || null } : {}),
        ...(dto.floor !== undefined ? { floor: dto.floor?.trim() || null } : {}),
        ...(dto.location !== undefined ? { location: dto.location?.trim() || null } : {}),
        ...(dto.facilities !== undefined ? { facilities: dto.facilities } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ROOM_UPDATED',
      module: 'TIMETABLE',
      resourceId: room.id,
      metadata: { name: room.name, code: room.code },
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

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: data.academicYearId, schoolId },
      select: { id: true },
    });
    if (!academicYear) {
      throw new BadRequestException('Select an academic year from this school.');
    }
    if (data.termId) {
      const term = await this.prisma.term.findFirst({
        where: { id: data.termId, academicYearId: data.academicYearId },
        select: { id: true },
      });
      if (!term) {
        throw new BadRequestException('Select a term that belongs to the academic year.');
      }
    }
    const name = data.name?.trim();
    if (!name) {
      throw new BadRequestException('Bell schedule name is required.');
    }
    if (!Array.isArray(periods) || periods.length === 0) {
      throw new BadRequestException('Add at least one period to the bell schedule.');
    }

    const seenNumbers = new Set<number>();
    const cleanedPeriods = periods.map((period) => {
      const periodName = period.name?.trim();
      if (!periodName) {
        throw new BadRequestException('Every period needs a name.');
      }
      if (!Number.isInteger(period.periodNumber) || period.periodNumber < 1) {
        throw new BadRequestException('Period numbers must be positive whole numbers.');
      }
      if (seenNumbers.has(period.periodNumber)) {
        throw new BadRequestException(`Period ${period.periodNumber} is defined more than once.`);
      }
      seenNumbers.add(period.periodNumber);
      if (period.startTime >= period.endTime) {
        throw new BadRequestException(`Period ${periodName} must end after it starts.`);
      }
      return {
        periodNumber: period.periodNumber,
        name: periodName,
        startTime: period.startTime,
        endTime: period.endTime,
        isBreak: Boolean(period.isBreak),
        duration: period.duration,
        ...(period.dayOfWeek ? { dayOfWeek: period.dayOfWeek } : {}),
      };
    });

    const schedule = await this.prisma.bellSchedule.create({
      data: {
        academicYearId: data.academicYearId,
        ...(data.termId ? { termId: data.termId } : {}),
        name,
        schoolId,
        periods: { create: cleanedPeriods },
      },
      include: { periods: { orderBy: { periodNumber: 'asc' } } },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'BELL_SCHEDULE_CREATED',
      module: 'TIMETABLE',
      resourceId: schedule.id,
      metadata: { name: schedule.name, periods: cleanedPeriods.length },
    });

    return schedule;
  }

  async findAllBellSchedules(schoolId: string) {
    return this.prisma.bellSchedule.findMany({
      where: { schoolId },
      include: { periods: { orderBy: { periodNumber: 'asc' } } }
    });
  }

  // Timetable Entries & Conflict Detection
  async createTimetableEntry(schoolId: string, dto: CreateTimetableEntryDto, actorId: string) {
    const startTime = dto.startTime;
    const endTime = dto.endTime;
    if (!startTime || !endTime || startTime >= endTime) {
      throw new BadRequestException('The period must end after it starts.');
    }
    if (!Number.isInteger(dto.dayOfWeek) || dto.dayOfWeek < 1 || dto.dayOfWeek > 7) {
      throw new BadRequestException('Day of week must be between 1 (Monday) and 7 (Sunday).');
    }

    const [academicYear, clazz, subject, teacher, room, period, section] = await Promise.all([
      this.prisma.academicYear.findFirst({
        where: { id: dto.academicYearId, schoolId },
        select: { id: true },
      }),
      this.prisma.class.findFirst({
        where: { id: dto.classId, schoolId },
        select: { id: true },
      }),
      this.prisma.subject.findFirst({
        where: { id: dto.subjectId, schoolId },
        select: { id: true },
      }),
      this.prisma.teacher.findFirst({
        where: { id: dto.teacherId, schoolId },
        select: { id: true, status: true },
      }),
      dto.roomId
        ? this.prisma.room.findFirst({ where: { id: dto.roomId, schoolId }, select: { id: true } })
        : Promise.resolve(null),
      dto.periodId
        ? this.prisma.period.findFirst({
            where: { id: dto.periodId, bellSchedule: { schoolId } },
            select: { id: true, startTime: true, endTime: true },
          })
        : Promise.resolve(null),
      dto.sectionId
        ? this.prisma.section.findFirst({
            where: { id: dto.sectionId, classId: dto.classId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!academicYear) throw new BadRequestException('Select an academic year from this school.');
    if (!clazz) throw new BadRequestException('Select a class from this school.');
    if (!subject) throw new BadRequestException('Select a subject from this school.');
    if (!teacher) throw new BadRequestException('Select a teacher from this school.');
    if (teacher.status !== 'ACTIVE') {
      throw new BadRequestException('The selected teacher is not active.');
    }
    if (dto.roomId && !room) throw new BadRequestException('Select a room from this school.');
    if (dto.periodId && !period) throw new BadRequestException('Select a period from this school.');
    if (dto.sectionId && !section) {
      throw new BadRequestException('Select a section that belongs to the selected class.');
    }
    if (dto.termId) {
      const term = await this.prisma.term.findFirst({
        where: { id: dto.termId, academicYearId: dto.academicYearId },
        select: { id: true },
      });
      if (!term) throw new BadRequestException('Select a term that belongs to the academic year.');
    }

    // Check for conflicts
    const conflicts = await this.checkConflicts(schoolId, dto);
    if (conflicts.length > 0) {
      throw new ConflictException({
        message: conflicts[0].message || 'Scheduling conflict detected.',
        conflicts
      });
    }

    // Create entry
    const entry = await this.prisma.timetableEntry.create({
      data: {
        schoolId,
        academicYearId: dto.academicYearId,
        ...(dto.termId ? { termId: dto.termId } : {}),
        ...(dto.versionId ? { versionId: dto.versionId } : {}),
        classId: dto.classId,
        ...(dto.sectionId ? { sectionId: dto.sectionId } : {}),
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        ...(dto.teacherAssignmentId ? { teacherAssignmentId: dto.teacherAssignmentId } : {}),
        ...(dto.roomId ? { roomId: dto.roomId } : {}),
        ...(dto.periodId ? { periodId: dto.periodId } : {}),
        dayOfWeek: dto.dayOfWeek,
        startTime,
        endTime,
        status: 'PUBLISHED',
      },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: true,
        room: true,
        period: true,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TIMETABLE_ENTRY_CREATED',
      module: 'TIMETABLE',
      resourceId: entry.id,
      metadata: {
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        dayOfWeek: dto.dayOfWeek,
      },
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

    const commonWhere: any = {
      schoolId,
      dayOfWeek,
      id: excludeId ? { not: excludeId } : undefined,
      status: { notIn: ['CANCELLED', 'REPLACED'] },
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
    const where: Prisma.TimetableEntryWhereInput = { schoolId };
    const stringFilters = [
      'academicYearId',
      'termId',
      'classId',
      'sectionId',
      'teacherId',
      'roomId',
      'versionId',
      'status',
    ] as const;
    for (const key of stringFilters) {
      const value = filters?.[key];
      if (typeof value === 'string' && value.trim()) {
        (where as any)[key] = value.trim();
      }
    }
    if (filters?.dayOfWeek !== undefined && filters.dayOfWeek !== '') {
      const day = Number(filters.dayOfWeek);
      if (Number.isInteger(day) && day >= 1 && day <= 7) {
        where.dayOfWeek = day;
      }
    } else if (filters?.dayOfWeek !== undefined) {
      throw new BadRequestException('Day of week must be between 1 and 7.');
    }

    return this.prisma.timetableEntry.findMany({
      where,
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
        { startTime: 'asc' }
      ]
    });
  }

  // Substitutions
  async findAllSubstitutions(schoolId: string) {
    return this.prisma.teacherSubstitution.findMany({
      where: { schoolId },
      include: {
        originalTeacher: true,
        substituteTeacher: true,
        timetableEntry: {
          include: { class: true, section: true, subject: true, room: true, period: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }
  async createSubstitution(schoolId: string, dto: CreateSubstitutionDto, actorId: string) {
    const entry = await this.prisma.timetableEntry.findFirst({
      where: { id: dto.timetableEntryId, schoolId },
      include: { period: true },
    });
    if (!entry) throw new NotFoundException('Timetable entry not found.');

    if (entry.teacherId !== dto.originalTeacherId) {
      throw new BadRequestException('The original teacher does not match this timetable entry.');
    }
    if (dto.substituteTeacherId === dto.originalTeacherId) {
      throw new BadRequestException('Choose a different teacher to substitute.');
    }
    const substitute = await this.prisma.teacher.findFirst({
      where: { id: dto.substituteTeacherId, schoolId },
      select: { id: true, status: true },
    });
    if (!substitute) {
      throw new BadRequestException('Select a substitute teacher from this school.');
    }
    if (substitute.status !== 'ACTIVE') {
      throw new BadRequestException('The substitute teacher is not active.');
    }
    const date = dto.date instanceof Date ? dto.date : new Date(String(dto.date));
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Enter a valid substitution date.');
    }
    date.setHours(0, 0, 0, 0);

    const duplicate = await this.prisma.teacherSubstitution.findFirst({
      where: {
        schoolId,
        timetableEntryId: dto.timetableEntryId,
        date,
        status: { notIn: ['REJECTED', 'CANCELLED'] },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException('A substitution is already scheduled for this class on that date.');
    }

    const conflicts = await this.checkConflicts(
      schoolId,
      { ...entry, teacherId: dto.substituteTeacherId } as any,
      entry.id,
    );

    if (conflicts.length > 0) {
      throw new ConflictException(conflicts[0].message || 'Substitute teacher has a conflict at this time.');
    }

    const sub = await this.prisma.teacherSubstitution.create({
      data: {
        schoolId,
        timetableEntryId: dto.timetableEntryId,
        originalTeacherId: dto.originalTeacherId,
        substituteTeacherId: dto.substituteTeacherId,
        date,
        ...(dto.reason ? { reason: dto.reason.trim() } : {}),
        status: 'PENDING',
      },
      include: {
        originalTeacher: true,
        substituteTeacher: true,
        timetableEntry: { include: { class: true, section: true, subject: true } },
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TEACHER_SUBSTITUTION_CREATED',
      module: 'TIMETABLE',
      resourceId: sub.id,
      metadata: {
        timetableEntryId: dto.timetableEntryId,
        originalTeacherId: dto.originalTeacherId,
        substituteTeacherId: dto.substituteTeacherId,
        date: date.toISOString().slice(0, 10),
      },
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
      this.prisma.timetableEntry.count({ where: { schoolId, status: 'PUBLISHED' } }),
      this.prisma.teacherSubstitution.count({ where: { schoolId, status: 'PENDING' } }),
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
