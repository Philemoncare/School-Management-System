import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from './dto/academic-year.dto';
import { AcademicYearStatus } from '@prisma/client';

@Injectable()
export class AcademicYearsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateAcademicYearDto, actorId: string) {
    // Check for unique code within school
    const existing = await this.prisma.academicYear.findFirst({
      where: { schoolId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Academic year code already exists in this school');
    }

    // Check for overlaps (simplified check)
    const overlapping = await this.prisma.academicYear.findFirst({
      where: {
        schoolId,
        OR: [
          {
            startDate: { lte: dto.endDate },
            endDate: { gte: dto.startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('Academic year dates overlap with an existing one');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          where: { schoolId, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      const academicYear = await tx.academicYear.create({
        data: {
          ...dto,
          schoolId,
        },
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'ACADEMIC_YEAR_CREATED',
        module: 'ACADEMICS',
        resourceId: academicYear.id,
        metadata: { name: academicYear.name, code: academicYear.code },
      });

      return academicYear;
    });
  }

  async findAll(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
      include: {
        _count: {
          select: { terms: true, enrollments: true },
        },
      },
    });
  }

  async findOne(schoolId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id, schoolId },
      include: { terms: true },
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async update(schoolId: string, id: string, dto: UpdateAcademicYearDto, actorId: string) {
    const year = await this.findOne(schoolId, id);

    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({
          where: { schoolId, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      const updated = await tx.academicYear.update({
        where: { id },
        data: dto,
      });

      await this.audit.log({
        userId: actorId,
        schoolId,
        action: 'ACADEMIC_YEAR_UPDATED',
        module: 'ACADEMICS',
        resourceId: id,
        metadata: dto,
      });

      return updated;
    });
  }

  async setStatus(schoolId: string, id: string, status: AcademicYearStatus, actorId: string) {
    await this.findOne(schoolId, id);

    const updated = await this.prisma.academicYear.update({
      where: { id },
      data: { status },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: `ACADEMIC_YEAR_${status}`,
      module: 'ACADEMICS',
      resourceId: id,
    });

    return updated;
  }

  async getCurrent(schoolId: string) {
    const current = await this.prisma.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      include: { terms: true },
    });
    if (!current) throw new NotFoundException('No current academic year found');
    return current;
  }
}
