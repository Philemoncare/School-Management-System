import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssignSubjectDto } from './dto/class-subject.dto';

@Injectable()
export class ClassSubjectsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async assign(schoolId: string, dto: AssignSubjectDto, actorId: string) {
    // Validate class
    const clazz = await this.prisma.class.findFirst({
      where: { id: dto.classId, schoolId },
    });
    if (!clazz) throw new NotFoundException('Class not found');

    // Validate section if provided
    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({
        where: { id: dto.sectionId, classId: dto.classId },
      });
      if (!section) throw new NotFoundException('Section not found in this class');
    }

    // Validate subject
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, schoolId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    // Check for existing assignment
    const existing = await this.prisma.classSubject.findFirst({
      where: {
        classId: dto.classId,
        sectionId: dto.sectionId || null,
        subjectId: dto.subjectId,
      },
    });
    if (existing) throw new ConflictException('Subject already assigned to this class/section');

    const assignment = await this.prisma.classSubject.create({
      data: {
        ...dto,
        schoolId,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'CLASS_SUBJECT_ASSIGNED',
      module: 'ACADEMICS',
      resourceId: assignment.id,
      metadata: dto,
    });

    return assignment;
  }

  async findByClass(schoolId: string, classId: string, sectionId?: string) {
    return this.prisma.classSubject.findMany({
      where: {
        schoolId,
        classId,
        ...(sectionId ? { sectionId } : { sectionId: null }),
      },
      include: {
        subject: true,
      },
    });
  }

  async remove(schoolId: string, id: string, actorId: string) {
    const assignment = await this.prisma.classSubject.findFirst({
      where: { id, schoolId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.prisma.classSubject.delete({ where: { id } });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'CLASS_SUBJECT_REMOVED',
      module: 'ACADEMICS',
      resourceId: id,
    });

    return { success: true };
  }
}
