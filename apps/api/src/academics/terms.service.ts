import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTermDto, UpdateTermDto } from './dto/term.dto';
import { TermStatus } from '@prisma/client';

@Injectable()
export class TermsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateTermDto, actorId: string) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId },
    });
    if (!year) throw new NotFoundException('Academic year not found');

    const existing = await this.prisma.term.findFirst({
      where: {
        academicYearId: dto.academicYearId,
        OR: [{ code: dto.code }, { sequence: dto.sequence }],
      },
    });
    if (existing) throw new ConflictException('Term code or sequence already exists in this year');

    // Date validation: term must be within academic year
    if (dto.startDate < year.startDate || dto.endDate > year.endDate) {
      throw new BadRequestException('Term dates must be within the academic year dates');
    }

    const term = await this.prisma.term.create({
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TERM_CREATED',
      module: 'ACADEMICS',
      resourceId: term.id,
      metadata: { name: term.name, academicYearId: term.academicYearId },
    });

    return term;
  }

  async findByYear(schoolId: string, academicYearId: string) {
    return this.prisma.term.findMany({
      where: {
        academicYearId,
        academicYear: { schoolId },
      },
      orderBy: { sequence: 'asc' },
    });
  }

  async update(schoolId: string, id: string, dto: UpdateTermDto, actorId: string) {
    const term = await this.prisma.term.findFirst({
      where: { id, academicYear: { schoolId } },
    });
    if (!term) throw new NotFoundException('Term not found');

    const updated = await this.prisma.term.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'TERM_UPDATED',
      module: 'ACADEMICS',
      resourceId: id,
    });

    return updated;
  }
}
