import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TeacherDocumentService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(schoolId: string, teacherId: string, category?: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const where: any = { teacherId };
    if (category) where.category = category;

    return this.prisma.staffDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(schoolId: string, teacherId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const document = await this.prisma.staffDocument.findFirst({
      where: { id, teacherId },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async upload(
    schoolId: string,
    teacherId: string,
    dto: any,
    actorId: string,
  ) {
    if (!dto.fileName || !dto.filePath) {
      throw new BadRequestException('fileName and filePath are required');
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const document = await this.prisma.$transaction(async (tx) => {
      const created = await tx.staffDocument.create({
        data: {
          teacherId,
          title: dto.title || dto.fileName || 'Document',
          documentType: dto.documentType || dto.category || 'GENERAL',
          fileUrl: dto.fileUrl || dto.filePath || '',
          storageKey: dto.storageKey || dto.fileName || '',
          ...(dto.description ? { description: dto.description.trim() || null } : {}),
          uploadedById: actorId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_DOCUMENT_UPLOADED',
          module: 'TEACHERS',
          resourceId: created.id,
          metadata: {
            teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            fileName: dto.fileName,
            category: dto.category || 'GENERAL',
          },
        },
      });

      return created;
    });

    return document;
  }

  async remove(schoolId: string, teacherId: string, id: string, actorId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found in this school');

    const existing = await this.prisma.staffDocument.findFirst({
      where: { id, teacherId },
    });
    if (!existing) throw new NotFoundException('Document not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.staffDocument.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: actorId,
          schoolId,
          action: 'TEACHER_DOCUMENT_DELETED',
          module: 'TEACHERS',
          resourceId: id,
          metadata: { teacherId },
        },
      });
    });

    return { success: true };
  }
}
