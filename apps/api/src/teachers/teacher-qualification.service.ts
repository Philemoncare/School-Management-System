import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeacherQualificationDto } from './dto/teacher-qualification.dto';
import { UpdateTeacherQualificationDto } from './dto/teacher-qualification.dto';

@Injectable()
export class TeacherQualificationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(schoolId: string, teacherId: string, verificationStatus?: string) {
    // Verify teacher belongs to school
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const where: any = { teacherId };
    if (verificationStatus) where.verificationStatus = verificationStatus as any;

    return this.prisma.staffQualification.findMany({
      where,
      orderBy: { completionDate: 'desc' },
    });
  }

  async findOne(schoolId: string, teacherId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const qualification = await this.prisma.staffQualification.findFirst({
      where: { id, teacherId },
    });
    if (!qualification) throw new NotFoundException('Qualification not found');
    return qualification;
  }

  async create(
    schoolId: string,
    teacherId: string,
    dto: CreateTeacherQualificationDto,
    actorId: string,
  ) {
    // Verify teacher belongs to school
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const qualification = await this.prisma.$transaction(async (tx) => {
      const created = await tx.staffQualification.create({
        data: {
          teacherId,
          institution: dto.institution.trim(),
          qualification: dto.qualification.trim(),
          fieldOfStudy: dto.fieldOfStudy.trim(),
          startDate: new Date(dto.startDate),
          ...(dto.completionDate ? { completionDate: new Date(dto.completionDate) } : {}),
          ...(dto.grade ? { grade: dto.grade.trim() } : {}),
          verificationStatus: dto.verificationStatus || 'PENDING',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_QUALIFICATION_CREATED',
          module: 'TEACHERS',
          resourceId: created.id,
          metadata: {
            teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            qualification: dto.qualification,
            institution: dto.institution,
          },
        },
      });

      return created;
    });

    return qualification;
  }

  async update(
    schoolId: string,
    teacherId: string,
    id: string,
    dto: UpdateTeacherQualificationDto,
    actorId: string,
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const existing = await this.prisma.staffQualification.findFirst({
      where: { id, teacherId },
    });
    if (!existing) throw new NotFoundException('Qualification not found');

    const qualification = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.staffQualification.update({
        where: { id },
        data: {
          ...(dto.institution !== undefined ? { institution: dto.institution.trim() } : {}),
          ...(dto.qualification !== undefined ? { qualification: dto.qualification.trim() } : {}),
          ...(dto.fieldOfStudy !== undefined ? { fieldOfStudy: dto.fieldOfStudy.trim() } : {}),
          ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
          ...(dto.completionDate !== undefined
            ? { completionDate: new Date(dto.completionDate) }
            : {}),
          ...(dto.grade !== undefined ? { grade: dto.grade.trim() || null } : {}),
          ...(dto.verificationStatus !== undefined
            ? { verificationStatus: dto.verificationStatus }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_QUALIFICATION_UPDATED',
          module: 'TEACHERS',
          resourceId: id,
          metadata: { teacherId, changedFields: Object.keys(dto) },
        },
      });

      return updated;
    });

    return qualification;
  }

  async remove(
    schoolId: string,
    teacherId: string,
    id: string,
    actorId: string,
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const existing = await this.prisma.staffQualification.findFirst({
      where: { id, teacherId },
    });
    if (!existing) throw new NotFoundException('Qualification not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.staffQualification.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_QUALIFICATION_DELETED',
          module: 'TEACHERS',
          resourceId: id,
          metadata: { teacherId },
        },
      });
    });

    return { success: true };
  }
}
