import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';
import { CreateStaffDto, UpdateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
    private settings: SettingsService,
  ) {}

  private async validateDepartmentAndPosition(
    schoolId: string,
    departmentId?: string | null,
    positionId?: string | null,
  ) {
    let department: { id: string; name: string } | null = null;
    let position: { id: string; name: string; departmentId: string | null } | null = null;

    if (departmentId) {
      department = await this.prisma.department.findFirst({
        where: { id: departmentId, schoolId },
        select: { id: true, name: true },
      });
      if (!department) {
        throw new BadRequestException('The selected department does not belong to this school.');
      }
    }

    if (positionId) {
      position = await this.prisma.position.findFirst({
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

    return { department, position };
  }

  async create(schoolId: string, dto: CreateStaffDto, actorId: string) {
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();
    if (!firstName || !lastName) {
      throw new BadRequestException('First name and last name are required.');
    }

    const employeeId =
      dto.employeeId?.trim() || (await this.settings.generateNextNumber(schoolId, 'STAFF'));

    const existing = await this.prisma.staff.findFirst({
      where: { schoolId, employeeId },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Employee ID already exists');

    const { department, position } = await this.validateDepartmentAndPosition(
      schoolId,
      dto.departmentId,
      dto.positionId,
    );

    const staff = await this.prisma.staff.create({
      data: {
        schoolId,
        firstName,
        middleName: dto.middleName?.trim() || null,
        lastName,
        employeeId,
        designation: dto.designation?.trim() || position?.name || department?.name || null,
        departmentId: department?.id ?? null,
        positionId: position?.id ?? null,
        status: dto.status ?? 'ACTIVE',
      },
      include: { department: true, position: true, user: true },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'STAFF_CREATED',
      module: 'STAFF',
      resourceId: staff.id,
      metadata: { employeeId: staff.employeeId, name: `${firstName} ${lastName}` },
    });

    await this.outbox.dispatch(
      new DomainEvent(
        'STAFF_CREATED',
        'STAFF',
        staff.id,
        { staffId: staff.id, employeeId: staff.employeeId },
        schoolId,
        actorId,
      ),
    );

    return staff;
  }

  async findAll(schoolId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      schoolId,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { employeeId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: {
          user: {
            select: { email: true, isActive: true },
          },
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
        },
      }),
      this.prisma.staff.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async findOne(schoolId: string, id: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, schoolId },
      include: { user: true, department: true, position: true },
    });
    if (!staff) {
      // Try teacher
      const teacher = await this.prisma.teacher.findFirst({
        where: { id, schoolId },
        include: { user: true, department: true, position: true },
      });
      if (!teacher) throw new NotFoundException('Employee not found');
      return teacher;
    }
    return staff;
  }

  async update(schoolId: string, id: string, dto: UpdateStaffDto, actorId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id, schoolId },
      select: { id: true, employeeId: true },
    });
    if (!staff) throw new NotFoundException('Staff record not found');

    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();
    if (firstName === '' || lastName === '') {
      throw new BadRequestException('First name and last name cannot be empty.');
    }

    const employeeId = dto.employeeId?.trim();
    if (employeeId && employeeId !== staff.employeeId) {
      const duplicate = await this.prisma.staff.findFirst({
        where: { schoolId, employeeId, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('Employee ID already exists');
    }

    const departmentId =
      dto.departmentId === undefined ? undefined : dto.departmentId || null;
    const positionId = dto.positionId === undefined ? undefined : dto.positionId || null;

    const { department, position } = await this.validateDepartmentAndPosition(
      schoolId,
      departmentId,
      positionId,
    );

    const updated = await this.prisma.staff.update({
      where: { id },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(dto.middleName !== undefined
          ? { middleName: dto.middleName?.trim() || null }
          : {}),
        ...(lastName ? { lastName } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(dto.designation !== undefined
          ? { designation: dto.designation?.trim() || null }
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
      action: 'STAFF_UPDATED',
      module: 'STAFF',
      resourceId: id,
      metadata: {
        employeeId: updated.employeeId,
        department: department?.name,
        position: position?.name,
      },
    });

    return updated;
  }

  async findMe(schoolId: string, userId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { userId, schoolId },
      include: { user: true, department: true, position: true },
    });
    if (!staff) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId, schoolId },
        include: { user: true, department: true, position: true },
      });
      if (!teacher) throw new NotFoundException('Staff profile not found');
      return teacher;
    }
    return staff;
  }
}
