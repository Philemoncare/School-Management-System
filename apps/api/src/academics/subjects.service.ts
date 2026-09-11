import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateSubjectDto, actorId: string) {
    const existing = await this.prisma.subject.findFirst({
      where: { schoolId, code: dto.code },
    });
    if (existing) throw new ConflictException('Subject code already exists');

    const subject = await this.prisma.subject.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'SUBJECT_CREATED',
      module: 'ACADEMICS',
      resourceId: subject.id,
      metadata: { name: subject.name },
    });

    return subject;
  }

  async findAll(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, schoolId },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async update(schoolId: string, id: string, dto: UpdateSubjectDto, actorId: string) {
    await this.findOne(schoolId, id);

    const updated = await this.prisma.subject.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'SUBJECT_UPDATED',
      module: 'ACADEMICS',
      resourceId: id,
    });

    return updated;
  }
}
