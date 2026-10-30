import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateGuardianDto, LinkGuardianDto, UpdateLinkGuardianDto } from './dto/create-guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateGuardianDto, actorId: string) {
    const guardian = await this.prisma.guardian.create({
      data: dto,
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
      }
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

  async findAll(schoolId: string) {
    return this.prisma.guardian.findMany({
      where: {
        students: {
          some: {
            student: { schoolId }
          }
        }
      },
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }
}
