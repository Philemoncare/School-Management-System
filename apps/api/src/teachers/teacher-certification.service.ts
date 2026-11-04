import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeacherCertificationDto } from './dto/teacher-certification.dto';
import { UpdateTeacherCertificationDto } from './dto/teacher-certification.dto';

@Injectable()
export class TeacherCertificationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(schoolId: string, teacherId: string, verificationStatus?: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const where: any = { teacherId };
    if (verificationStatus) where.verificationStatus = verificationStatus as any;

    return this.prisma.staffCertification.findMany({
      where,
      orderBy: { issueDate: 'desc' },
    });
  }

  async findOne(schoolId: string, teacherId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const certification = await this.prisma.staffCertification.findFirst({
      where: { id, teacherId },
    });
    if (!certification) throw new NotFoundException('Certification not found');
    return certification;
  }

  async create(
    schoolId: string,
    teacherId: string,
    dto: CreateTeacherCertificationDto,
    actorId: string,
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const certification = await this.prisma.$transaction(async (tx) => {
      const created = await tx.staffCertification.create({
        data: {
          teacherId,
          name: dto.name.trim(),
          issuingOrganization: dto.issuingOrganization.trim(),
          ...(dto.certificateNumber ? { certificateNumber: dto.certificateNumber.trim() } : {}),
          issueDate: new Date(dto.issueDate),
          ...(dto.expiryDate ? { expiryDate: new Date(dto.expiryDate) } : {}),
          verificationStatus: dto.verificationStatus || 'PENDING',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_CERTIFICATION_CREATED',
          module: 'TEACHERS',
          resourceId: created.id,
          metadata: {
            teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            certification: dto.name,
            issuingOrganization: dto.issuingOrganization,
          },
        },
      });

      return created;
    });

    return certification;
  }

  async update(
    schoolId: string,
    teacherId: string,
    id: string,
    dto: UpdateTeacherCertificationDto,
    actorId: string,
  ) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const existing = await this.prisma.staffCertification.findFirst({
      where: { id, teacherId },
    });
    if (!existing) throw new NotFoundException('Certification not found');

    const certification = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.staffCertification.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.issuingOrganization !== undefined
            ? { issuingOrganization: dto.issuingOrganization.trim() }
            : {}),
          ...(dto.certificateNumber !== undefined
            ? { certificateNumber: dto.certificateNumber.trim() || null }
            : {}),
          ...(dto.issueDate !== undefined ? { issueDate: new Date(dto.issueDate) } : {}),
          ...(dto.expiryDate !== undefined
            ? { expiryDate: new Date(dto.expiryDate) || null }
            : {}),
          ...(dto.verificationStatus !== undefined
            ? { verificationStatus: dto.verificationStatus }
            : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_CERTIFICATION_UPDATED',
          module: 'TEACHERS',
          resourceId: id,
          metadata: { teacherId, changedFields: Object.keys(dto) },
        },
      });

      return updated;
    });

    return certification;
  }

  async remove(schoolId: string, teacherId: string, id: string, actorId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const existing = await this.prisma.staffCertification.findFirst({
      where: { id, teacherId },
    });
    if (!existing) throw new NotFoundException('Certification not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.staffCertification.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_CERTIFICATION_DELETED',
          module: 'TEACHERS',
          resourceId: id,
          metadata: { teacherId },
        },
      });
    });

    return { success: true };
  }
}
