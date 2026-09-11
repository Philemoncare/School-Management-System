import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTeacherAssignmentDto } from './dto/teacher-assignment.dto';

@Injectable()
export class TeacherAssignmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateTeacherAssignmentDto, actorId: string) {
    // Basic verification of all related entities within the school
    const teacher = await this.prisma.teacher.findFirst({ where: { id: dto.teacherId, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const subject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } });
    if (!subject) throw new NotFoundException('Subject not found');

    const section = await this.prisma.section.findFirst({ where: { id: dto.sectionId, class: { schoolId } } });
    if (!section) throw new NotFoundException('Section not found');

    const year = await this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } });
    if (!year) throw new NotFoundException('Academic year not found');

    // Check for duplicates
    const existing = await this.prisma.teacherAssignment.findFirst({
      where: {
        teacherId: dto.teacherId,
        subjectId: dto.subjectId,
        sectionId: dto.sectionId,
        academicYearId: dto.academicYearId,
        termId: dto.termId || null,
      },
    });
    if (existing) throw new ConflictException('Teacher already assigned to this subject/section for this period');

    const assignment = await this.prisma.teacherAssignment.create({
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TEACHER_ASSIGNED',
      module: 'ACADEMICS',
      resourceId: assignment.id,
      metadata: dto,
    });

    return assignment;
  }

  async findAll(schoolId: string) {
    return this.prisma.teacherAssignment.findMany({
      where: { academicYear: { schoolId } },
      include: {
        teacher: true,
        subject: true,
        section: { include: { class: true } },
        academicYear: true,
        term: true,
      },
    });
  }

  async remove(schoolId: string, id: string, actorId: string) {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { id, academicYear: { schoolId } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    await this.prisma.teacherAssignment.delete({ where: { id } });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TEACHER_ASSIGNMENT_REMOVED',
      module: 'ACADEMICS',
      resourceId: id,
    });

    return { success: true };
  }
}
