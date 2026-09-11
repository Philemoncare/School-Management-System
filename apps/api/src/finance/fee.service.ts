import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFeeCategoryDto } from './dto/fee-category.dto';
import { CreateFeeStructureDto } from './dto/fee-structure.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FeeService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Categories
  async createCategory(schoolId: string, dto: CreateFeeCategoryDto, actorId: string) {
    const existing = await this.prisma.feeCategory.findFirst({
      where: { schoolId, code: dto.code },
    });
    if (existing) throw new ConflictException('Fee category code already exists');

    const category = await this.prisma.feeCategory.create({
      data: { ...dto, schoolId },
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

  async findAllCategories(schoolId: string) {
    return this.prisma.feeCategory.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  // Structures
  async createStructure(schoolId: string, dto: CreateFeeStructureDto, actorId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    const structure = await this.prisma.feeStructure.create({
      data: {
        ...dto,
        schoolId,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency || school?.currency || 'USD',
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

  async findStructures(schoolId: string, filters: any = {}) {
    return this.prisma.feeStructure.findMany({
      where: { schoolId, ...filters },
      include: {
        feeCategory: true,
        academicYear: true,
        term: true,
        class: true,
      },
      orderBy: { createdAt: 'desc' },
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
}
