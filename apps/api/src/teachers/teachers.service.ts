import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OutboxService } from '../workflow/events/outbox.service';
import { DomainEvent } from '../workflow/events/domain-event';
import { AccountState, InvitationStatus, Role } from '@prisma/client';
import { EmailProvider } from '../communication/providers/email.provider';

const INVITE_TTL_DAYS = 7;

function hashToken(token: string) {
  const { createHash } = require('node:crypto');
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class TeachersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private outbox: OutboxService,
    @Inject(forwardRef(() => EmailProvider))
    private emailProvider: EmailProvider,
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

    const email = dto.email.trim().toLowerCase();

    const existingTeacherByEmail = await this.prisma.teacher.findFirst({
      where: { schoolId, email },
    });
    if (existingTeacherByEmail) {
      throw new ConflictException('A teacher with this email already exists in this school.');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      const existingMembership = await this.prisma.schoolMembership.findFirst({
        where: { schoolId, userId: existingUser.id },
      });
      if (existingMembership) {
        throw new ConflictException('A user with this email is already a member of this school.');
      }
    }

    // Find the TEACHER role for this school
    const teacherRole = await this.prisma.role.findFirst({
      where: { name: 'TEACHER', schoolId },
    });
    if (!teacherRole) {
      throw new NotFoundException('TEACHER role not found for this school. Please seed roles first.');
    }

    const token = require('node:crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const teacher = await tx.teacher.create({
        data: {
          firstName: dto.firstName,
          middleName: dto.middleName || null,
          lastName: dto.lastName,
          email,
          phone: dto.phone || null,
          employeeId,
          specialization: dto.specialization || null,
          status: dto.status || 'ACTIVE',
          departmentId: dto.departmentId || null,
          positionId: dto.positionId || null,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender || null,
          address: dto.address || null,
          nationalId: dto.nationalId || null,
          dateOfJoining: dto.dateOfJoining ? new Date(dto.dateOfJoining) : null,
          yearsOfExperience: dto.yearsOfExperience || null,
          emergencyContactName: dto.emergencyContactName || null,
          emergencyContactPhone: dto.emergencyContactPhone || null,
          bankAccountName: dto.bankAccountName || null,
          bankAccountNumber: dto.bankAccountNumber || null,
          bankName: dto.bankName || null,
          schoolId,
          userId: null,
        },
      });

      const invitation = await tx.invitation.create({
        data: {
          schoolId,
          email,
          roleId: teacherRole.id,
          tokenHash: hashToken(token),
          expiresAt,
          invitedById: actorId,
        },
        select: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          role: { select: { id: true, name: true } },
        },
      });

      const baseUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl.replace(/\/$/, '')}/invite/accept?token=${token}`;

      // Send invitation email
      const delivery = await this.emailProvider
        .send({
          to: email,
          subject: `You have been invited to join ${await this.getSchoolName(tx, schoolId)} as a Teacher`,
          body: [
            `You have been invited to join as a Teacher.`,
            '',
            `Accept the invitation and set your password: ${inviteLink}`,
            '',
            `This link expires on ${expiresAt.toDateString()}.`,
          ].join('\n'),
        })
        .catch((error) => ({
          success: false,
          error: error instanceof Error ? error.message : 'Email delivery failed',
        }));

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'TEACHER_CREATED',
        module: 'TEACHERS',
        resourceId: teacher.id,
        metadata: {
          employeeId: teacher.employeeId,
          email,
          invitationId: invitation.id,
          inviteLink,
        },
      }, tx);

      await this.outbox.dispatch(
        new DomainEvent(
          'TEACHER_CREATED',
          'TEACHER',
          teacher.id,
          { teacherId: teacher.id, employeeId: teacher.employeeId, email },
          schoolId,
          actorId
        ),
        tx
      );

      return {
        teacher,
        invitation: {
          ...invitation,
          inviteLink,
          delivery,
        },
        message: 'Teacher record created. An invitation has been sent to the teacher\'s email address. They must accept the invitation to activate their account.',
      };
    });
  }

  private async getSchoolName(tx: any, schoolId: string): Promise<string> {
    const school = await tx.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });
    return school?.name || 'this school';
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
