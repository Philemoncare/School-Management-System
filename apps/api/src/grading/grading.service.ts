import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateGradingScaleDto, UpdateGradingScaleDto } from '../results/dto/grading.dto';

interface BandInput {
  minimumPercentage: number;
  maximumPercentage: number;
  grade: string;
  gradePoint?: number | null;
  remark?: string | null;
  sequence?: number;
}

@Injectable()
export class GradingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Grade bands are the source of truth for every calculated result, so an
   * overlapping or inverted range must be rejected rather than quietly
   * producing the wrong grade for a percentage.
   */
  private validateBands(bands: BandInput[]) {
    const seen = new Set<string>();
    for (const band of bands) {
      if (!band.grade?.trim()) {
        throw new BadRequestException('Every grade band needs a grade label.');
      }
      if (band.minimumPercentage > band.maximumPercentage) {
        throw new BadRequestException(
          `Grade ${band.grade} has a minimum above its maximum percentage.`,
        );
      }
      if (band.minimumPercentage < 0 || band.maximumPercentage > 100) {
        throw new BadRequestException('Grade band percentages must be between 0 and 100.');
      }
      const label = band.grade.trim().toUpperCase();
      if (seen.has(label)) {
        throw new BadRequestException(`Grade ${band.grade} appears more than once.`);
      }
      seen.add(label);
    }

    const sorted = [...bands].sort((a, b) => a.minimumPercentage - b.minimumPercentage);
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (current.minimumPercentage <= previous.maximumPercentage) {
        throw new BadRequestException(
          `Grade bands ${previous.grade} and ${current.grade} overlap. Ranges must be exclusive.`,
        );
      }
    }
  }

  private normaliseBands(bands: BandInput[] = []) {
    return bands.map((band, index) => ({
      minimumPercentage: Number(band.minimumPercentage),
      maximumPercentage: Number(band.maximumPercentage),
      grade: band.grade.trim().toUpperCase(),
      gradePoint: band.gradePoint == null ? null : Number(band.gradePoint),
      remark: band.remark?.trim() || null,
      sequence: band.sequence == null ? index : Number(band.sequence),
    }));
  }

  async createScale(schoolId: string, dto: CreateGradingScaleDto, actorId: string) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.gradingScale.findFirst({
      where: { schoolId, code },
    });
    if (existing) throw new ConflictException('A grading scale with this code already exists.');

    const bands = this.normaliseBands(dto.gradeBands);
    this.validateBands(bands);

    if (dto.policyId) {
      const policy = await this.prisma.gradingPolicy.findFirst({
        where: { id: dto.policyId, schoolId },
        select: { id: true },
      });
      if (!policy) throw new NotFoundException('Grading policy not found in this school.');
    }

    const scale = await this.prisma.gradingScale.create({
      data: {
        schoolId,
        name: dto.name.trim(),
        code,
        description: dto.description?.trim() || null,
        policyId: dto.policyId || null,
        status: dto.status ?? true,
        gradeBands: { create: bands },
      },
      include: { gradeBands: { orderBy: { sequence: 'asc' } } },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'GRADING_SCALE_CREATED',
      module: 'GRADING',
      resourceId: scale.id,
      metadata: { code: scale.code, bands: bands.length },
    });

    return scale;
  }

  async updateScale(
    schoolId: string,
    id: string,
    dto: UpdateGradingScaleDto,
    actorId: string,
  ) {
    const scale = await this.prisma.gradingScale.findFirst({ where: { id, schoolId } });
    if (!scale) throw new NotFoundException('Grading scale not found');

    const code = dto.code ? dto.code.trim().toUpperCase() : undefined;
    if (code && code !== scale.code) {
      const duplicate = await this.prisma.gradingScale.findFirst({
        where: { schoolId, code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('A grading scale with this code already exists.');
    }

    const bands = dto.gradeBands ? this.normaliseBands(dto.gradeBands) : undefined;
    if (bands) this.validateBands(bands);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (bands) {
        await tx.gradeBand.deleteMany({ where: { gradingScaleId: id } });
      }
      return tx.gradingScale.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(code ? { code } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() || null }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(bands ? { gradeBands: { create: bands } } : {}),
        },
        include: { gradeBands: { orderBy: { sequence: 'asc' } } },
      });
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'GRADING_SCALE_UPDATED',
      module: 'GRADING',
      resourceId: id,
      metadata: { code: updated.code, bands: updated.gradeBands.length },
    });

    return updated;
  }

  async calculateGrade(schoolId: string, scaleId: string, percentage: number) {
    const scale = await this.prisma.gradingScale.findFirst({
      where: { id: scaleId, schoolId },
      select: { id: true },
    });
    if (!scale) throw new NotFoundException('Grading scale not found');

    const bands = await this.prisma.gradeBand.findMany({
      where: { gradingScaleId: scaleId },
      orderBy: { minimumPercentage: 'desc' },
    });

    const band = bands.find(
      (b) => percentage >= b.minimumPercentage && percentage <= b.maximumPercentage,
    );
    return band || null;
  }

  async findAllScales(schoolId: string) {
    return this.prisma.gradingScale.findMany({
      where: { schoolId },
      include: { gradeBands: { orderBy: { sequence: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const scale = await this.prisma.gradingScale.findFirst({
      where: { id, schoolId },
      include: { gradeBands: { orderBy: { sequence: 'asc' } } },
    });
    if (!scale) throw new NotFoundException('Grading scale not found');
    return scale;
  }
}
