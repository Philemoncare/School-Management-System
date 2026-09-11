import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GradingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createScale(schoolId: string, dto: any, actorId: string) {
    const existing = await this.prisma.gradingScale.findFirst({
      where: { schoolId, code: dto.code },
    });
    if (existing) throw new ConflictException('Grading scale code already exists');

    const scale = await this.prisma.gradingScale.create({
      data: {
        ...dto,
        schoolId,
        gradeBands: {
          create: dto.gradeBands || [],
        },
      },
      include: { gradeBands: true },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'GRADING_SCALE_CREATED',
      module: 'GRADING',
      resourceId: scale.id,
    });

    return scale;
  }

  async calculateGrade(schoolId: string, scaleId: string, percentage: number) {
    const bands = await this.prisma.gradeBand.findMany({
      where: { gradingScaleId: scaleId },
      orderBy: { minimumPercentage: 'desc' },
    });

    const band = bands.find(b => percentage >= b.minimumPercentage && percentage <= b.maximumPercentage);
    return band || null;
  }

  async findAllScales(schoolId: string) {
    return this.prisma.gradingScale.findMany({
      where: { schoolId },
      include: { gradeBands: true },
    });
  }
}
