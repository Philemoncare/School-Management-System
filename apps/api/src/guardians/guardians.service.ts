import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateGuardianDto, LinkGuardianDto, UpdateLinkGuardianDto } from './dto/create-guardian.dto';

interface GuardianFilter {
  page?: number;
  limit?: number;
  search?: string;
}

@Injectable()
export class GuardiansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateGuardianDto, actorId: string) {
    const email = dto.email?.trim().toLowerCase();
    
    // Check for duplicate email
    if (email) {
      const existing = await this.prisma.guardian.findFirst({ where: { email } });
      if (existing) {
        throw new ConflictException('A guardian with this email address already exists.');
      }
    }

    const guardian = await this.prisma.guardian.create({
      data: {
        ...dto,
        email,
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'GUARDIAN_CREATED',
      module: 'GUARDIANS',
      resourceId: guardian.id,
    });

    return guardian;
  }

  async linkToStudent(schoolId: string, studentId: string, dto: LinkGuardianDto, actorId: string) {
    // Verify student belongs to school
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found in this school');

    // Verify guardian exists
    const guardian = await this.prisma.guardian.findUnique({
      where: { id: dto.guardianId },
    });
    if (!guardian) throw new NotFoundException('Guardian not found');

    // Check for existing link
    const existingLink = await this.prisma.studentGuardian.findFirst({
      where: { studentId, guardianId: dto.guardianId },
    });
    if (existingLink) {
      throw new ConflictException('This guardian is already linked to this student.');
    }

    const link = await this.prisma.studentGuardian.create({
      data: {
        studentId,
        guardianId: dto.guardianId,
        relation: dto.relation,
        isPrimary: dto.isPrimary || false,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'GUARDIAN_LINKED',
      module: 'STUDENTS',
      resourceId: studentId,
      metadata: { guardianId: dto.guardianId, relation: dto.relation },
    });

    return link;
  }

  async findByStudent(schoolId: string, studentId: string) {
    return this.prisma.studentGuardian.findMany({
      where: {
        studentId,
        student: { schoolId }
      },
      include: {
        guardian: true
      },
      orderBy: [{ isPrimary: 'desc' }, { relation: 'asc' }],
    });
  }

  async unlinkFromStudent(schoolId: string, studentId: string, guardianId: string, actorId: string) {
    // Verify the link exists and belongs to this school
    const link = await this.prisma.studentGuardian.findFirst({
      where: {
        studentId,
        guardianId,
        student: { schoolId }
      }
    });
    if (!link) {
      throw new NotFoundException('Guardian is not linked to this student.');
    }

    await this.prisma.studentGuardian.delete({
      where: {
        studentId_guardianId: {
          studentId,
          guardianId
        }
      }
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'GUARDIAN_UNLINKED',
      module: 'STUDENTS',
      resourceId: studentId,
      metadata: { guardianId },
    });

    return { success: true };
  }

  async updateLink(schoolId: string, studentId: string, guardianId: string, dto: UpdateLinkGuardianDto, actorId: string) {
    // Verify the link exists and belongs to this school
    const link = await this.prisma.studentGuardian.findFirst({
      where: {
        studentId,
        guardianId,
        student: { schoolId }
      }
    });
    if (!link) {
      throw new NotFoundException('Guardian is not linked to this student.');
    }

    const updated = await this.prisma.studentGuardian.update({
      where: {
        studentId_guardianId: {
          studentId,
          guardianId
        }
      },
      data: {
        ...(dto.relation !== undefined ? { relation: dto.relation } : {}),
        ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
      }
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'GUARDIAN_LINK_UPDATED',
      module: 'STUDENTS',
      resourceId: studentId,
      metadata: { guardianId, changes: dto },
    });

    return updated;
  }

  async findAll(schoolId: string, filter: GuardianFilter = {}) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      students: {
        some: {
          student: { schoolId }
        }
      }
    };

    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.guardian.findMany({
        where,
        include: {
          _count: {
            select: { students: true }
          }
        },
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      this.prisma.guardian.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            student: true
          }
        }
      }
    });
    if (!guardian) throw new NotFoundException('Guardian not found');
    return guardian;
  }

  async update(id: string, dto: any, actorId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
    });
    if (!guardian) throw new NotFoundException('Guardian not found');

    // Check for duplicate email if changing
    if (dto.email && dto.email.toLowerCase() !== guardian.email?.toLowerCase()) {
      const existing = await this.prisma.guardian.findFirst({ where: { email: dto.email.toLowerCase() } });
      if (existing) {
        throw new ConflictException('A guardian with this email address already exists.');
      }
    }

    const updated = await this.prisma.guardian.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim().toLowerCase() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address.trim() || null } : {}),
      },
    });

    await this.audit.log({
      userId: actorId,
      action: 'GUARDIAN_UPDATED',
      module: 'GUARDIANS',
      resourceId: id,
    });

    return updated;
  }

  async remove(id: string, actorId: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      include: {
        students: true
      }
    });
    if (!guardian) throw new NotFoundException('Guardian not found');

    if (guardian.students.length > 0) {
      throw new ConflictException('Cannot delete guardian with linked students. Unlink from all students first.');
    }

    await this.prisma.guardian.delete({ where: { id } });

    await this.audit.log({
      userId: actorId,
      action: 'GUARDIAN_DELETED',
      module: 'GUARDIANS',
      resourceId: id,
    });

    return { success: true };
  }
}
