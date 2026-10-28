import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';

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

    const existing = await this.prisma.teacher.findFirst({
      where: { schoolId, employeeId },
    });
    if (existing) throw new ConflictException('Employee ID already exists');

    const teacher = await this.prisma.teacher.create({
      data: { ...dto, employeeId, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TEACHER_CREATED',
      module: 'TEACHERS',
      resourceId: teacher.id,
    });

    await this.outbox.dispatch(
      new DomainEvent(
        'TEACHER_CREATED',
        'TEACHER',
        teacher.id,
        { teacherId: teacher.id, employeeId: teacher.employeeId },
        schoolId,
        actorId
      )
    );

    return teacher;
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
        orderBy: { lastName: 'asc' },
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
}
