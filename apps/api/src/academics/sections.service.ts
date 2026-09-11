import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSectionDto, UpdateSectionDto } from './dto/section.dto';

@Injectable()
export class SectionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateSectionDto, actorId: string) {
    const clazz = await this.prisma.class.findFirst({
      where: { id: dto.classId, schoolId },
    });
    if (!clazz) throw new NotFoundException('Class not found');

    const existing = await this.prisma.section.findFirst({
      where: { classId: dto.classId, code: dto.code },
    });
    if (existing) throw new ConflictException('Section code already exists in this class');

    const section = await this.prisma.section.create({
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'SECTION_CREATED',
      module: 'ACADEMICS',
      resourceId: section.id,
      metadata: { name: section.name, classId: section.classId },
    });

    return section;
  }

  async findByClass(schoolId: string, classId: string) {
    return this.prisma.section.findMany({
      where: {
        classId,
        class: { schoolId },
      },
      orderBy: { name: 'asc' },
    });
  }

  async update(schoolId: string, id: string, dto: UpdateSectionDto, actorId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, class: { schoolId } },
    });
    if (!section) throw new NotFoundException('Section not found');

    const updated = await this.prisma.section.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'SECTION_UPDATED',
      module: 'ACADEMICS',
      resourceId: id,
    });

    return updated;
  }
}
