import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async create(schoolId: string, dto: CreateClassDto, actorId: string) {
    const existing = await this.prisma.class.findFirst({
      where: { schoolId, code: dto.code },
    });
    if (existing) throw new ConflictException('Class code already exists');

    const clazz = await this.prisma.class.create({
      data: { ...dto, schoolId },
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'CLASS_CREATED',
      module: 'ACADEMICS',
      resourceId: clazz.id,
      metadata: { name: clazz.name },
    });

    return clazz;
  }

  async findAll(schoolId: string) {
    return this.prisma.class.findMany({
      where: { schoolId },
      orderBy: { level: 'asc' },
      include: {
        _count: { select: { sections: true, enrollments: true } },
      },
    });
  }

  async findOne(schoolId: string, id: string) {
    const clazz = await this.prisma.class.findFirst({
      where: { id, schoolId },
      include: {
        sections: true,
        classSubjects: {
          include: { subject: true }
        }
      },
    });
    if (!clazz) throw new NotFoundException('Class not found');
    return clazz;
  }

  async update(schoolId: string, id: string, dto: UpdateClassDto, actorId: string) {
    await this.findOne(schoolId, id);

    const updated = await this.prisma.class.update({
      where: { id },
      data: dto,
    });

    await this.audit.log({
      userId: actorId,
      schoolId,
      action: 'CLASS_UPDATED',
      module: 'ACADEMICS',
      resourceId: id,
    });

    return updated;
  }
}
