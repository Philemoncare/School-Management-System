import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateGuardianDto, LinkGuardianDto } from './dto/create-guardian.dto';

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
}
