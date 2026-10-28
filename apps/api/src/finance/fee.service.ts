import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from './dto/fee-category.dto';
import { CreateFeeStructureDto, UpdateFeeStructureDto } from './dto/fee-structure.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FeeService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Categories
  async createCategory(schoolId: string, dto: CreateFeeCategoryDto, actorId: string) {
    const name = dto.name?.trim();
    const code = dto.code?.trim().toUpperCase();
    if (!name || !code) {
      throw new BadRequestException('Category name and code are required.');
    }

    const existing = await this.prisma.feeCategory.findFirst({
      where: { schoolId, code },
    });
    if (existing) throw new ConflictException('A fee category with this code already exists.');

    const category = await this.prisma.feeCategory.create({
      data: {
        schoolId,
        name,
        code,
        description: dto.description?.trim() || null,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'FEE_CATEGORY_CREATED',
      module: 'FINANCE',
      resourceId: category.id,
    });

    return category;
  }

  async updateCategory(
    schoolId: string,
    id: string,
    dto: UpdateFeeCategoryDto,
    actorId: string,
  ) {
    const category = await this.prisma.feeCategory.findFirst({ where: { id, schoolId } });
    if (!category) throw new NotFoundException('Fee category not found.');

    const code = dto.code ? dto.code.trim().toUpperCase() : undefined;
    if (code && code !== category.code) {
      const duplicate = await this.prisma.feeCategory.findFirst({
        where: { schoolId, code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException('A fee category with this code already exists.');
      }
    }

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Category name cannot be empty.');
    }

    const updated = await this.prisma.feeCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
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
      action: 'FEE_CATEGORY_UPDATED',
      module: 'FINANCE',
      resourceId: updated.id,
    });

    return updated;
  }

  async findAllCategories(schoolId: string) {
    return this.prisma.feeCategory.findMany({
      where: { schoolId },
      include: { _count: { select: { feeStructures: true } } },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  // Structures
  async createStructure(schoolId: string, dto: CreateFeeStructureDto, actorId: string) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Fee structure name is required.');

    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const dueDate = this.parseDate(dto.dueDate);
    await this.assertStructureReferences(schoolId, dto);

    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    const structure = await this.prisma.feeStructure.create({
      data: {
        schoolId,
        academicYearId: dto.academicYearId,
        termId: dto.termId || null,
        classId: dto.classId || null,
        sectionId: dto.sectionId || null,
        subjectId: dto.subjectId || null,
        feeCategoryId: dto.feeCategoryId,
        name,
        amount: new Prisma.Decimal(amount),
        currency: dto.currency || school?.currency || 'USD',
        dueDate,
        isMandatory: dto.isMandatory ?? true,
      },
      include: {
        feeCategory: true,
        academicYear: true,
        term: true,
        class: true,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'FEE_STRUCTURE_CREATED',
      module: 'FINANCE',
      resourceId: structure.id,
    });

    return structure;
  }

  async updateStructure(
    schoolId: string,
    id: string,
    dto: UpdateFeeStructureDto,
    actorId: string,
  ) {
    const structure = await this.prisma.feeStructure.findFirst({ where: { id, schoolId } });
    if (!structure) throw new NotFoundException('Fee structure not found.');

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Fee structure name cannot be empty.');
    }

    if (dto.amount !== undefined) {
      const amount = Number(dto.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException('Amount must be greater than zero.');
      }
    }

    const dueDate = dto.dueDate === undefined ? undefined : this.parseDate(dto.dueDate);

    await this.assertStructureReferences(schoolId, {
      academicYearId: dto.academicYearId ?? structure.academicYearId,
      termId: dto.termId ?? structure.termId ?? undefined,
      classId: dto.classId ?? structure.classId ?? undefined,
      sectionId: dto.sectionId ?? structure.sectionId ?? undefined,
      subjectId: dto.subjectId ?? structure.subjectId ?? undefined,
      feeCategoryId: dto.feeCategoryId ?? structure.feeCategoryId,
    });

    const updated = await this.prisma.feeStructure.update({
      where: { id },
      data: {
        ...(dto.academicYearId ? { academicYearId: dto.academicYearId } : {}),
        ...(dto.termId !== undefined ? { termId: dto.termId || null } : {}),
        ...(dto.classId !== undefined ? { classId: dto.classId || null } : {}),
        ...(dto.sectionId !== undefined ? { sectionId: dto.sectionId || null } : {}),
        ...(dto.subjectId !== undefined ? { subjectId: dto.subjectId || null } : {}),
        ...(dto.feeCategoryId ? { feeCategoryId: dto.feeCategoryId } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.amount !== undefined ? { amount: new Prisma.Decimal(Number(dto.amount)) } : {}),
        ...(dto.currency ? { currency: dto.currency } : {}),
        ...(dueDate ? { dueDate } : {}),
        ...(dto.isMandatory !== undefined ? { isMandatory: dto.isMandatory } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      include: {
        feeCategory: true,
        academicYear: true,
        term: true,
        class: true,
      },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'FEE_STRUCTURE_UPDATED',
      module: 'FINANCE',
      resourceId: updated.id,
    });

    return updated;
  }

  async findStructures(schoolId: string, filters: any = {}) {
    const { academicYearId, classId, feeCategoryId, termId, status } = filters ?? {};
    return this.prisma.feeStructure.findMany({
      where: {
        schoolId,
        ...(academicYearId ? { academicYearId } : {}),
        ...(classId ? { classId } : {}),
        ...(feeCategoryId ? { feeCategoryId } : {}),
        ...(termId ? { termId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        feeCategory: true,
        academicYear: true,
        term: true,
        class: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOneStructure(schoolId: string, id: string) {
    const structure = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId },
      include: {
        feeCategory: true,
        academicYear: true,
        term: true,
        class: true,
      },
    });
    if (!structure) throw new NotFoundException('Fee structure not found');
    return structure;
  }

  private parseDate(value: Date | string) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Enter a valid due date.');
    }
    return date;
  }

  /**
   * Every reference on a fee structure must belong to the active school.
   * Without these checks a caller could attach a structure to another
   * tenant's year, class or category by guessing its id.
   */
  private async assertStructureReferences(
    schoolId: string,
    refs: {
      academicYearId: string;
      termId?: string | null;
      classId?: string | null;
      sectionId?: string | null;
      subjectId?: string | null;
      feeCategoryId: string;
    },
  ) {
    const [year, category] = await Promise.all([
      this.prisma.academicYear.findFirst({
        where: { id: refs.academicYearId, schoolId },
        select: { id: true },
      }),
      this.prisma.feeCategory.findFirst({
        where: { id: refs.feeCategoryId, schoolId },
        select: { id: true },
      }),
    ]);
    if (!year) throw new NotFoundException('Academic year not found in this school.');
    if (!category) throw new NotFoundException('Fee category not found in this school.');

    if (refs.termId) {
      const term = await this.prisma.term.findFirst({
        where: { id: refs.termId, academicYearId: refs.academicYearId },
        select: { id: true },
      });
      if (!term) {
        throw new NotFoundException('The selected term does not belong to this academic year.');
      }
    }

    if (refs.classId) {
      const klass = await this.prisma.class.findFirst({
        where: { id: refs.classId, schoolId },
        select: { id: true },
      });
      if (!klass) throw new NotFoundException('Class not found in this school.');
    }

    if (refs.sectionId) {
      const section = await this.prisma.section.findFirst({
        where: {
          id: refs.sectionId,
          ...(refs.classId ? { classId: refs.classId } : {}),
          class: { schoolId },
        },
        select: { id: true },
      });
      if (!section) {
        throw new NotFoundException('The selected section does not belong to this school or class.');
      }
    }

    if (refs.subjectId) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: refs.subjectId, schoolId },
        select: { id: true },
      });
      if (!subject) throw new NotFoundException('Subject not found in this school.');
    }
  }
}
