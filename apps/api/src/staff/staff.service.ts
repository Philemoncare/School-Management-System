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
import { CreateStaffDto, UpdateStaffDto, GENDER_VALUES, EMPLOYMENT_TYPES } from './dto/create-staff.dto';
import { computeStaffCompletion, deriveAccountStatus } from './staff-profile.util';

@Injectable()
export class StaffService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
    private settings: SettingsService,
  ) {}

  /** Trim a string, treating empty as null. */
  private clean(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  }

  /** Parse an optional ISO date string into a Date, or null when empty/invalid. */
  private parseDate(value?: string | null): Date | null {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private normalizeGender(value?: string): string | null {
    const cleaned = this.clean(value);
    if (!cleaned) return null;
    const upper = cleaned.toUpperCase();
    if (!GENDER_VALUES.includes(upper)) {
      throw new BadRequestException(`Gender must be one of: ${GENDER_VALUES.join(', ')}.`);
    }
    return upper;
  }

  private normalizeEmploymentType(value?: string): string | null {
    const cleaned = this.clean(value);
    if (!cleaned) return null;
    const upper = cleaned.toUpperCase().replace(/[\s-]/g, '_');
    if (!EMPLOYMENT_TYPES.includes(upper)) {
      throw new BadRequestException(
        `Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}.`,
      );
    }
    return upper;
  }

  /** Email is normalized (trimmed + lowercased) so lookups and associations match. */
  private normalizeEmail(value?: string | null): string | null {
    const cleaned = this.clean(value);
    return cleaned ? cleaned.toLowerCase() : null;
  }

  /**
   * Build the shared detail columns for a create payload. Every field is
   * collected on the staff record itself (single source of truth) rather than
   * relying solely on a linked login account.
   */
  private buildCreateDetails(dto: CreateStaffDto) {
    return {
      email: this.normalizeEmail(dto.email),
      phone: this.clean(dto.phone),
      altPhone: this.clean(dto.altPhone),
      address: this.clean(dto.address),
      gender: this.normalizeGender(dto.gender),
      dateOfBirth: this.parseDate(dto.dateOfBirth),
      photoUrl: this.clean(dto.photoUrl),
      emergencyContactName: this.clean(dto.emergencyContactName),
      emergencyContactPhone: this.clean(dto.emergencyContactPhone),
      emergencyContactRelationship: this.clean(dto.emergencyContactRelationship),
      employmentType: this.normalizeEmploymentType(dto.employmentType),
      appointmentDate: this.parseDate(dto.appointmentDate),
      commencementDate: this.parseDate(dto.commencementDate),
      contractEndDate: this.parseDate(dto.contractEndDate),
      responsibilities: this.clean(dto.responsibilities),
    };
  }

  /**
   * Partial update mapping: only keys explicitly present in the payload are
   * written. An empty string clears a text column back to null.
   */
  private buildUpdateDetails(dto: UpdateStaffDto) {
    const data: Record<string, unknown> = {};
    if (dto.email !== undefined) data.email = this.normalizeEmail(dto.email);
    if (dto.phone !== undefined) data.phone = this.clean(dto.phone);
    if (dto.altPhone !== undefined) data.altPhone = this.clean(dto.altPhone);
    if (dto.address !== undefined) data.address = this.clean(dto.address);
    if (dto.gender !== undefined) data.gender = this.normalizeGender(dto.gender);
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = this.parseDate(dto.dateOfBirth);
    if (dto.photoUrl !== undefined) data.photoUrl = this.clean(dto.photoUrl);
    if (dto.emergencyContactName !== undefined)
      data.emergencyContactName = this.clean(dto.emergencyContactName);
    if (dto.emergencyContactPhone !== undefined)
      data.emergencyContactPhone = this.clean(dto.emergencyContactPhone);
    if (dto.emergencyContactRelationship !== undefined)
      data.emergencyContactRelationship = this.clean(dto.emergencyContactRelationship);
    if (dto.employmentType !== undefined)
      data.employmentType = this.normalizeEmploymentType(dto.employmentType);
    if (dto.appointmentDate !== undefined)
      data.appointmentDate = this.parseDate(dto.appointmentDate);
    if (dto.commencementDate !== undefined)
      data.commencementDate = this.parseDate(dto.commencementDate);
    if (dto.contractEndDate !== undefined)
      data.contractEndDate = this.parseDate(dto.contractEndDate);
    if (dto.responsibilities !== undefined)
      data.responsibilities = this.clean(dto.responsibilities);
    return data;
  }

  /**
   * Validate that a supervisor belongs to the same school and is not the staff
   * member themselves.
   */
  private async validateSupervisor(
    schoolId: string,
    supervisorStaffId?: string | null,
    selfId?: string,
  ): Promise<string | null> {
    if (!supervisorStaffId) return null;
    if (selfId && supervisorStaffId === selfId) {
      throw new BadRequestException('A staff member cannot report to themselves.');
    }
    const supervisor = await this.prisma.staff.findFirst({
      where: { id: supervisorStaffId, schoolId },
      select: { id: true },
    });
    if (!supervisor) {
      throw new BadRequestException('The selected supervisor does not belong to this school.');
    }
    return supervisor.id;
  }

  /**
   * Enrich a staff record with the two statuses that must always be shown
   * independently: the profile completion (against the standard data
   * structure) and the derived login-account status.
   */
  private decorate(record: any) {
    if (!record) return record;
    return {
      ...record,
      completion: computeStaffCompletion(record),
      accountStatus: deriveAccountStatus(record),
    };
  }

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

    const supervisorStaffId = await this.validateSupervisor(schoolId, dto.supervisorStaffId);

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
        ...this.buildCreateDetails(dto),
        supervisorStaffId,
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

    return this.decorate(staff);
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
      return this.decorate(teacher);
    }
    return this.decorate(staff);
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

    let supervisorStaffId: string | null | undefined;
    if (dto.supervisorStaffId !== undefined) {
      supervisorStaffId = dto.supervisorStaffId
        ? await this.validateSupervisor(schoolId, dto.supervisorStaffId, id)
        : null;
    }

    const details = this.buildUpdateDetails(dto);

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
        ...(supervisorStaffId !== undefined ? { supervisorStaffId } : {}),
        ...details,
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

    return this.decorate(updated);
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
      return this.decorate(teacher);
    }
    return this.decorate(staff);
  }
}
