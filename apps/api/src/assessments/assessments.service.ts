import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAssessmentDto, UpdateAssessmentDto } from './dto/assessment.dto';
import { CreateAssessmentTypeDto, UpdateAssessmentTypeDto } from './dto/assessment-type.dto';
import { AssessmentStatus, Prisma, ScoreStatus } from '@prisma/client';

@Injectable()
export class AssessmentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Assessment Types
  async createType(schoolId: string, dto: CreateAssessmentTypeDto, actorId: string) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.assessmentType.findFirst({
      where: { schoolId, code },
    });
    if (existing) throw new ConflictException('Assessment type code already exists');

    const type = await this.prisma.assessmentType.create({
      data: { ...dto, name: dto.name.trim(), code, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ASSESSMENT_TYPE_CREATED',
      module: 'ASSESSMENTS',
      resourceId: type.id,
    });

    return type;
  }

  async findAllTypes(schoolId: string) {
    return this.prisma.assessmentType.findMany({
      where: { OR: [{ schoolId }, { schoolId: null }] },
      orderBy: { name: 'asc' },
    });
  }

  async updateType(
    schoolId: string,
    id: string,
    dto: UpdateAssessmentTypeDto,
    actorId: string,
  ) {
    const type = await this.prisma.assessmentType.findFirst({
      where: { id, schoolId },
    });
    if (!type) throw new NotFoundException('Assessment type not found in this school');

    const code = dto.code ? dto.code.trim().toUpperCase() : undefined;
    if (code && code !== type.code) {
      const duplicate = await this.prisma.assessmentType.findFirst({
        where: { schoolId, code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('Assessment type code already exists');
    }

    const updated = await this.prisma.assessmentType.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(code ? { code } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ASSESSMENT_TYPE_UPDATED',
      module: 'ASSESSMENTS',
      resourceId: id,
      metadata: { code: updated.code },
    });

    return updated;
  }

  // Assessments
  async create(schoolId: string, dto: CreateAssessmentDto, actorId: string) {
    // Verify entities
    const [year, clazz, subject, assessmentType] = await Promise.all([
      this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } }),
      this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } }),
      this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } }),
      this.prisma.assessmentType.findFirst({ where: { id: dto.assessmentTypeId, schoolId } }),
    ]);

    if (!year) throw new NotFoundException('Academic year not found');
    if (!clazz) throw new NotFoundException('Class not found');
    if (!subject) throw new NotFoundException('Subject not found');
    if (!assessmentType) throw new BadRequestException('Select an assessment type from this school.');

    if (dto.termId) {
      const term = await this.prisma.term.findFirst({
        where: { id: dto.termId, academicYearId: dto.academicYearId },
        select: { id: true },
      });
      if (!term) throw new BadRequestException('Select a term that belongs to the academic year.');
    }
    if (dto.sectionId) {
      const section = await this.prisma.section.findFirst({
        where: { id: dto.sectionId, classId: dto.classId },
        select: { id: true },
      });
      if (!section) throw new BadRequestException('Select a section that belongs to the class.');
    }
    const classSubjectCount = await this.prisma.classSubject.count({
      where: { classId: dto.classId },
    });
    if (classSubjectCount > 0) {
      const offered = await this.prisma.classSubject.findFirst({
        where: { classId: dto.classId, subjectId: dto.subjectId },
        select: { id: true },
      });
      if (!offered) {
        throw new BadRequestException(
          'This subject is not offered in the selected class. Assign it under Classes → Subjects first.',
        );
      }
    }
    if (dto.startDate && dto.endDate && dto.startDate > dto.endDate) {
      throw new BadRequestException('The assessment end date must be after the start date.');
    }
    if (!Number.isFinite(dto.totalMarks) || dto.totalMarks <= 0) {
      throw new BadRequestException('Total marks must be greater than zero.');
    }

    const code = dto.code?.trim();
    const name = dto.name?.trim();
    if (!code || !name) {
      throw new BadRequestException('Assessment name and code are required.');
    }
    const duplicate = await this.prisma.assessment.findFirst({
      where: {
        schoolId,
        academicYearId: dto.academicYearId,
        code: { equals: code, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(`An assessment with code "${code}" already exists for this academic year.`);
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        ...dto,
        code,
        name,
        schoolId,
        ...(dto.description ? { description: dto.description.trim() } : {}),
      },
      include: { assessmentType: true, class: true, section: true, subject: true },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ASSESSMENT_CREATED',
      module: 'ASSESSMENTS',
      resourceId: assessment.id,
      metadata: { name: assessment.name, code: assessment.code },
    });

    return assessment;
  }

  async findAll(schoolId: string, filters: any = {}) {
    const where: Prisma.AssessmentWhereInput = { schoolId };
    const stringFilters = [
      'academicYearId',
      'termId',
      'classId',
      'sectionId',
      'subjectId',
      'assessmentTypeId',
      'status',
    ] as const;
    for (const key of stringFilters) {
      const value = filters?.[key];
      if (typeof value === 'string' && value.trim()) {
        (where as any)[key] = value.trim();
      }
    }
    const search = typeof filters?.search === 'string' ? filters.search.trim() : '';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { subject: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.assessment.findMany({
      where,
      include: {
        assessmentType: true,
        class: true,
        section: true,
        subject: true,
        _count: { select: { scores: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id, schoolId },
      include: {
        assessmentType: true,
        class: true,
        section: true,
        subject: true,
        components: true,
        scores: {
          include: { student: true }
        }
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async update(schoolId: string, id: string, dto: UpdateAssessmentDto, actorId: string) {
    const assessment = await this.prisma.assessment.findFirst({ where: { id, schoolId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    if (assessment.status === AssessmentStatus.LOCKED) {
      throw new ForbiddenException('Cannot update a locked assessment');
    }

    const updated = await this.prisma.assessment.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'ASSESSMENT_UPDATED',
      module: 'ASSESSMENTS',
      resourceId: id,
    });

    return updated;
  }

  async updateStatus(schoolId: string, id: string, status: AssessmentStatus, actorId: string) {
    const assessment = await this.prisma.assessment.findFirst({ where: { id, schoolId } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const updated = await this.prisma.assessment.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: `ASSESSMENT_STATUS_${status}`,
      module: 'ASSESSMENTS',
      resourceId: id,
    });

    return updated;
  }
}
