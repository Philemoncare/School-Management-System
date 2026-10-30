import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';
import * as argon2 from 'argon2';
import { AccountState } from '@prisma/client';

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
  ) {}

  async create(schoolId: string, dto: CreateTeacherDto, actorId: string) {
    let employeeId = dto.employeeId;
    if (!employeeId) {
      const [staffCount, teacherCount] = await Promise.all([
        this.prisma.staff.count({ where: { schoolId } }),
        this.prisma.teacher.count({ where: { schoolId } }),
      ]);
      employeeId = `STF-${(staffCount + teacherCount + 1).toString().padStart(6, '0')}`;
    }

    const existingTeacher = await this.prisma.teacher.findFirst({
      where: { schoolId, employeeId },
    });
    if (existingTeacher) throw new ConflictException('Employee ID already exists');

    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existingUser) throw new ConflictException('A user with this email already exists');

    const passwordHash = await argon2.hash(dto.email.slice(0, 8) + 'Teacher#2026', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone || null,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          accountState: AccountState.ACTIVE,
          emailVerified: new Date(),
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          ...dto,
          employeeId,
          schoolId,
          userId: user.id,
        },
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'TEACHER_CREATED',
        module: 'TEACHERS',
        resourceId: teacher.id,
        metadata: { employeeId: teacher.employeeId, email: dto.email },
      }, tx);

      await this.outbox.dispatch(
        new DomainEvent(
          'TEACHER_CREATED',
          'TEACHER',
          teacher.id,
          { teacherId: teacher.id, employeeId: teacher.employeeId },
          schoolId,
          actorId
        ),
        tx
      );

      return teacher;
    });
  }

  async findAll(schoolId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId,
      ...(search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          user: {
            select: { email: true, isActive: true }
          }
        }
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(schoolId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, schoolId },
      include: {
        user: true,
        assignments: {
          include: {
            subject: true,
            section: {
              include: { class: true }
            }
          }
        }
      }
    });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async update(schoolId: string, id: string, dto: UpdateTeacherDto, actorId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, schoolId },
      select: { id: true, employeeId: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();
    if (firstName === '' || lastName === '') {
      throw new BadRequestException('First name and last name cannot be empty.');
    }

    const employeeId = dto.employeeId?.trim();
    if (employeeId && employeeId !== teacher.employeeId) {
      const duplicate = await this.prisma.teacher.findFirst({
        where: { schoolId, employeeId, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('Employee ID already exists');
    }

    const departmentId =
      dto.departmentId === undefined ? undefined : dto.departmentId || null;
    const positionId = dto.positionId === undefined ? undefined : dto.positionId || null;

    if (departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: departmentId, schoolId },
        select: { id: true },
      });
      if (!department) {
        throw new BadRequestException('The selected department does not belong to this school.');
      }
    }
    if (positionId) {
      const position = await this.prisma.position.findFirst({
        where: { id: positionId, schoolId },
        select: { id: true, name: true, departmentId: true },
      });
      if (!position) {
        throw new BadRequestException('The selected position does not belong to this school.');
      }
      if (position.departmentId && departmentId && position.departmentId !== departmentId) {
        throw new BadRequestException(
          `"${position.name}" belongs to a different department. Pick a position from the selected department.`,
        );
      }
    }

    const updated = await this.prisma.teacher.update({
      where: { id },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(dto.middleName !== undefined
          ? { middleName: dto.middleName?.trim() || null }
          : {}),
        ...(lastName ? { lastName } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(dto.specialization !== undefined
          ? { specialization: dto.specialization?.trim() || null }
          : {}),
        ...(departmentId !== undefined ? { departmentId } : {}),
        ...(positionId !== undefined ? { positionId } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: { department: true, position: true, user: true },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TEACHER_UPDATED',
      module: 'TEACHERS',
      resourceId: id,
      metadata: { employeeId: updated.employeeId },
    });

    return updated;
  }
}
