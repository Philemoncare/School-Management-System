import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  TeacherTaskStatus,
  Prisma,
} from '@prisma/client';

export interface CreateTeacherTaskDto {
  title: string;
  description?: string;
  category: string;
  priority?: string;
  instructions?: string;
  assignedToId: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  academicYearId?: string;
  termId?: string;
  startDate: string;
  dueDate: string;
}

export interface UpdateTeacherTaskDto {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: TeacherTaskStatus;
  instructions?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  academicYearId?: string;
  termId?: string;
  startDate?: string;
  dueDate?: string;
  completionNote?: string;
}

export interface TaskFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: TeacherTaskStatus;
  priority?: string;
  category?: string;
  assignedToId?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  overdue?: boolean;
}

@Injectable()
export class TeacherTaskService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async create(
    schoolId: string,
    dto: CreateTeacherTaskDto,
    actorId: string,
  ) {
    // Validate assignedTo user exists and belongs to school
    const assignedTo = await this.prisma.user.findFirst({
      where: {
        id: dto.assignedToId,
        memberships: { some: { schoolId, status: 'ACTIVE' } },
      },
    });
    if (!assignedTo) {
      throw new NotFoundException(
        'Assigned user not found or does not belong to this school',
      );
    }

    // Validate actor belongs to school and has permission
    const actor = await this.prisma.user.findFirst({
      where: {
        id: actorId,
        memberships: { some: { schoolId, status: 'ACTIVE' } },
      },
      include: { userRoles: { include: { role: true } } },
    });
    if (!actor) {
      throw new ForbiddenException('You do not belong to this school');
    }

    const isAdminOrPrincipal =
      actor.userRoles?.some(
        (ur) =>
          ur.role.name === 'SCHOOL_ADMIN' ||
          ur.role.name === 'PRINCIPAL' ||
          ur.role.name === 'HR_OFFICER',
      ) ?? false;
    if (!isAdminOrPrincipal) {
      throw new ForbiddenException(
        'Only school administrators can assign tasks',
      );
    }

    // Validate optional related entities belong to school
    if (dto.classId) {
      const cls = await this.prisma.class.findFirst({
        where: { id: dto.classId, schoolId },
      });
      if (!cls) throw new NotFoundException('Class not found in this school');
    }
    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({
        where: { id: dto.sectionId, class: { schoolId } },
      });
      if (!section) throw new NotFoundException('Section not found in this school');
    }
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, schoolId },
      });
      if (!subject) throw new NotFoundException('Subject not found in this school');
    }

    const startDate = new Date(dto.startDate);
    const dueDate = new Date(dto.dueDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid start or due date');
    }
    if (dueDate <= startDate) {
      throw new BadRequestException('Due date must be after start date');
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.teacherTask.create({
        data: {
          schoolId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          category: dto.category.trim(),
          priority: (dto.priority || 'MEDIUM') as any,
          status: 'ASSIGNED' as any,
          instructions: dto.instructions?.trim() || null,
          assignedById: actorId,
          assignedToId: dto.assignedToId,
          classId: dto.classId || null,
          sectionId: dto.sectionId || null,
          subjectId: dto.subjectId || null,
          academicYearId: dto.academicYearId || null,
          termId: dto.termId || null,
          startDate,
          dueDate,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_TASK_CREATED',
          module: 'TEACHER_TASKS',
          resourceId: created.id,
          metadata: {
            title: created.title,
            assignedToId: dto.assignedToId,
            category: created.category,
            priority: created.priority,
            dueDate: created.dueDate,
          },
        },
      });

      return created;
    });

    // Notify the assigned teacher
    await this.notifications.send(
      dto.assignedToId,
      `New Task Assigned: ${task.title}`,
      `You have been assigned a new task: "${task.title}". Due: ${dueDate.toLocaleDateString()}.`,
      'TASK_ASSIGNED',
      schoolId,
    );

    return task;
  }

  async findAll(schoolId: string, filter: TaskFilter, actorId: string) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      category,
      assignedToId,
      classId,
      sectionId,
      subjectId,
      overdue,
    } = filter;

    const skip = (page - 1) * limit;

    const where: Prisma.TeacherTaskWhereInput = {
      schoolId,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(category ? { category } : {}),
      ...(assignedToId ? { assignedToId } : {}),
      ...(classId ? { classId } : {}),
      ...(sectionId ? { sectionId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(overdue
        ? {
            status: {
              notIn: ['COMPLETED', 'CANCELLED'] as any,
            },
            dueDate: { lt: new Date() },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.teacherTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          assignedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          class: { select: { id: true, name: true, code: true } },
          section: { select: { id: true, name: true, code: true } },
          subject: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.teacherTask.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(schoolId: string, id: string, actorId: string) {
    const task = await this.prisma.teacherTask.findFirst({
      where: { id, schoolId },
      include: {
        assignedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, name: true, code: true } },
        academicYear: { select: { id: true, name: true, code: true } },
        term: { select: { id: true, name: true, code: true } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    // Verify actor has access to this school (already enforced by tenant guard)
    // Teachers can only see their own assigned tasks unless they're admin
    const actor = await this.prisma.user.findFirst({
      where: { id: actorId, memberships: { some: { schoolId } } },
      include: { userRoles: { include: { role: true } } },
    });
    if (!actor) throw new ForbiddenException('Access denied');

    const isAdminOrPrincipal =
      actor.userRoles?.some(
        (ur) =>
          ur.role.name === 'SCHOOL_ADMIN' ||
          ur.role.name === 'PRINCIPAL' ||
          ur.role.name === 'HR_OFFICER',
      ) ?? false;

    if (!isAdminOrPrincipal && task.assignedToId !== actorId) {
      throw new ForbiddenException('You can only view your own tasks');
    }

    return task;
  }

  async update(
    schoolId: string,
    id: string,
    dto: UpdateTeacherTaskDto,
    actorId: string,
  ) {
    const task = await this.prisma.teacherTask.findFirst({
      where: { id, schoolId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const actor = await this.prisma.user.findFirst({
      where: { id: actorId, memberships: { some: { schoolId } } },
      include: { userRoles: { include: { role: true } } },
    });
    if (!actor) throw new ForbiddenException('Access denied');

    const isAdminOrPrincipal =
      actor.userRoles?.some(
        (ur) =>
          ur.role.name === 'SCHOOL_ADMIN' ||
          ur.role.name === 'PRINCIPAL' ||
          ur.role.name === 'HR_OFFICER',
      ) ?? false;

    // Teachers can only update status/completionNote on their own tasks
    if (!isAdminOrPrincipal) {
      if (task.assignedToId !== actorId) {
        throw new ForbiddenException('You can only update your own tasks');
      }
      // Teachers can only change status and completionNote
      const allowedFields = ['status', 'completionNote'];
      const providedFields = Object.keys(dto);
      const invalidFields = providedFields.filter(
        (f) => !allowedFields.includes(f),
      );
      if (invalidFields.length > 0) {
        throw new ForbiddenException(
          `Teachers can only update: ${allowedFields.join(', ')}`,
        );
      }
      // Teachers can only set certain statuses
      if (
        dto.status &&
        !['ACKNOWLEDGED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW'].includes(
          dto.status,
        )
      ) {
        throw new ForbiddenException(
          'Teachers cannot set this task status directly',
        );
      }
    }

    // Validate status transitions
    if (dto.status && dto.status !== task.status) {
      const validTransitions: Record<string, string[]> = {
        ASSIGNED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'CANCELLED'],
        ACKNOWLEDGED: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['SUBMITTED_FOR_REVIEW', 'CANCELLED'],
        SUBMITTED_FOR_REVIEW: ['COMPLETED', 'RETURNED_FOR_REVISION'],
        RETURNED_FOR_REVISION: ['IN_PROGRESS', 'CANCELLED'],
        COMPLETED: [],
        OVERDUE: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
        CANCELLED: [],
      };
      const allowed = validTransitions[task.status] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from ${task.status} to ${dto.status}. Allowed: ${allowed.join(', ')}`,
        );
      }
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid start date');
    }
    if (dueDate && Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid due date');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.teacherTask.update({
        where: { id },
        data: {
          ...(dto.title ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() || null }
            : {}),
          ...(dto.category ? { category: dto.category.trim() } : {}),
          ...(dto.priority ? { priority: dto.priority as any } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.instructions !== undefined
            ? { instructions: dto.instructions.trim() || null }
            : {}),
          ...(startDate ? { startDate } : {}),
          ...(dueDate ? { dueDate } : {}),
          ...(dto.completionNote !== undefined
            ? { completionNote: dto.completionNote.trim() || null }
            : {}),
          ...(dto.status === 'COMPLETED'
            ? { completedAt: new Date() }
            : {}),
          ...(dto.classId !== undefined ? { classId: dto.classId || null } : {}),
          ...(dto.sectionId !== undefined
            ? { sectionId: dto.sectionId || null }
            : {}),
          ...(dto.subjectId !== undefined
            ? { subjectId: dto.subjectId || null }
            : {}),
          ...(dto.academicYearId !== undefined
            ? { academicYearId: dto.academicYearId || null }
            : {}),
          ...(dto.termId !== undefined ? { termId: dto.termId || null } : {}),
        },
        include: {
          assignedBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_TASK_UPDATED',
          module: 'TEACHER_TASKS',
          resourceId: id,
          metadata: {
            changedFields: Object.keys(dto),
            previousStatus: task.status,
            newStatus: dto.status || task.status,
          },
        },
      });

      return result;
    });

    // Notify assignee if status changed
    if (dto.status && dto.status !== task.status) {
      await this.notifications.send(
        task.assignedToId,
        `Task Status Updated: ${task.title}`,
        `Your task "${task.title}" is now ${dto.status.toLowerCase().replace('_', ' ')}.`,
        'TASK_STATUS_CHANGED',
        schoolId,
      );

      // Notify assigner if teacher submitted for review
      if (
        dto.status === 'SUBMITTED_FOR_REVIEW' &&
        task.assignedById !== actorId
      ) {
        await this.notifications.send(
          task.assignedById,
          `Task Submitted for Review: ${task.title}`,
          `${actor.firstName} ${actor.lastName} has submitted "${task.title}" for review.`,
          'TASK_SUBMITTED',
          schoolId,
        );
      }
    }

    return updated;
  }

  async remove(schoolId: string, id: string, actorId: string) {
    const task = await this.prisma.teacherTask.findFirst({
      where: { id, schoolId },
    });
    if (!task) throw new NotFoundException('Task not found');

    const actor = await this.prisma.user.findFirst({
      where: { id: actorId, memberships: { some: { schoolId } } },
      include: { userRoles: { include: { role: true } } },
    });
    if (!actor) throw new ForbiddenException('Access denied');

    const isAdminOrPrincipal =
      actor.userRoles?.some(
        (ur) =>
          ur.role.name === 'SCHOOL_ADMIN' ||
          ur.role.name === 'PRINCIPAL' ||
          ur.role.name === 'HR_OFFICER',
      ) ?? false;
    if (!isAdminOrPrincipal) {
      throw new ForbiddenException('Only administrators can delete tasks');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.teacherTask.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_TASK_DELETED',
          module: 'TEACHER_TASKS',
          resourceId: id,
          metadata: { title: task.title },
        },
      });
    });

    return { success: true };
  }

  async getStats(schoolId: string) {
    const [
      total,
      pending,
      inProgress,
      completed,
      overdue,
      submittedForReview,
      returnedForRevision,
      cancelled,
    ] = await Promise.all([
      this.prisma.teacherTask.count({ where: { schoolId } }),
      this.prisma.teacherTask.count({
        where: { schoolId, status: 'ASSIGNED' as any },
      }),
      this.prisma.teacherTask.count({
        where: { schoolId, status: 'IN_PROGRESS' as any },
      }),
      this.prisma.teacherTask.count({
        where: { schoolId, status: 'COMPLETED' as any },
      }),
      this.prisma.teacherTask.count({
        where: {
          schoolId,
          status: { notIn: ['COMPLETED', 'CANCELLED'] as any },
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.teacherTask.count({
        where: { schoolId, status: 'SUBMITTED_FOR_REVIEW' as any },
      }),
      this.prisma.teacherTask.count({
        where: { schoolId, status: 'RETURNED_FOR_REVISION' as any },
      }),
      this.prisma.teacherTask.count({
        where: { schoolId, status: 'CANCELLED' as any },
      }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      submittedForReview,
      returnedForRevision,
      cancelled,
    };
  }

  async getTeacherTaskSummary(schoolId: string, teacherId: string) {
    const tasks = await this.prisma.teacherTask.findMany({
      where: { schoolId, assignedToId: teacherId },
      orderBy: [{ dueDate: 'asc' }],
      include: {
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'ASSIGNED').length,
      acknowledged: tasks.filter((t) => t.status === 'ACKNOWLEDGED').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      submittedForReview: tasks.filter(
        (t) => t.status === 'SUBMITTED_FOR_REVIEW',
      ).length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      overdue: tasks.filter(
        (t) =>
          t.status !== 'COMPLETED' &&
          t.status !== 'CANCELLED' &&
          t.dueDate < new Date(),
      ).length,
    };

    return { stats, tasks };
  }
}
