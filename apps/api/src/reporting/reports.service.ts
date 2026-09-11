import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDefinitionDto, ExecuteReportDto, CreateReportScheduleDto, UpdateReportDefinitionDto, CreateReportDatasetDto, CreateReportFieldDto } from './dto/report.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('reports') private reportQueue: Queue,
  ) {}

  async createDefinition(schoolId: string | null, dto: CreateReportDefinitionDto, actorId: string) {
    const { config, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      const definition = await tx.reportDefinition.create({
        data: {
          ...data,
          schoolId,
          currentVersion: 1,
        }
      });

      await tx.reportVersion.create({
        data: {
          reportDefinitionId: definition.id,
          version: 1,
          config: config as any,
          createdById: actorId,
          changeDescription: 'Initial version'
        }
      });

      return definition;
    });
  }

  async updateDefinition(schoolId: string, id: string, dto: UpdateReportDefinitionDto, actorId: string) {
    const definition = await this.findOneDefinition(schoolId, id);

    return this.prisma.$transaction(async (tx) => {
      const newVersionNumber = definition.currentVersion + 1;

      const version = await tx.reportVersion.create({
        data: {
          reportDefinitionId: id,
          version: newVersionNumber,
          config: dto.config as any,
          changeDescription: dto.changeDescription,
          createdById: actorId,
        }
      });

      await tx.reportDefinition.update({
        where: { id },
        data: { currentVersion: newVersionNumber }
      });

      return version;
    });
  }

  async findAllDefinitions(schoolId: string) {
    return this.prisma.reportDefinition.findMany({
      where: {
        OR: [{ schoolId }, { schoolId: null }],
        status: 'ACTIVE'
      },
      include: {
        dataset: true,
      },
      orderBy: { category: 'asc' }
    });
  }

  async findOneDefinition(schoolId: string, id: string) {
    const definition = await this.prisma.reportDefinition.findFirst({
      where: { id, OR: [{ schoolId }, { schoolId: null }] },
      include: {
        dataset: { include: { fields: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 }
      }
    });
    if (!definition) throw new NotFoundException('Report definition not found');
    return definition;
  }

  async executeReport(schoolId: string, id: string, dto: ExecuteReportDto, actorId: string) {
    const definition = await this.findOneDefinition(schoolId, id);
    const latestVersion = definition.versions[0];

    const execution = await this.prisma.reportExecution.create({
      data: {
        schoolId,
        reportDefinitionId: id,
        reportVersionId: latestVersion.id,
        executedById: actorId,
        parameters: dto.parameters as any,
        format: dto.format || 'PDF',
        status: 'PENDING'
      }
    });

    // Add to BullMQ for background processing
    await this.reportQueue.add('process-report', { executionId: execution.id });

    return execution;
  }

  // Dataset Management
  async createDataset(dto: CreateReportDatasetDto) {
    return this.prisma.reportDataset.create({
      data: dto
    });
  }

  async addFieldToDataset(datasetId: string, dto: CreateReportFieldDto) {
    return this.prisma.reportField.create({
      data: {
        ...dto,
        datasetId
      }
    });
  }

  async findAllDatasets() {
    return this.prisma.reportDataset.findMany({
      include: { fields: true }
    });
  }

  async getExecutions(schoolId: string, definitionId?: string) {
    return this.prisma.reportExecution.findMany({
      where: { schoolId, reportDefinitionId: definitionId },
      include: { reportDefinition: true, reportVersion: true, executedBy: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async createSchedule(schoolId: string, dto: CreateReportScheduleDto, actorId: string) {
    const { recipients, ...data } = dto;
    return this.prisma.reportSchedule.create({
      data: {
        ...data,
        schoolId,
        createdById: actorId,
        parameters: dto.parameters as any,
        recipients: {
          create: recipients
        }
      },
      include: { recipients: true }
    });
  }

  async deleteDefinition(schoolId: string, id: string) {
    const definition = await this.findOneDefinition(schoolId, id);
    if (definition.schoolId === null) {
      throw new BadRequestException('Cannot delete platform-default report definitions');
    }

    return this.prisma.reportDefinition.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }

  async deleteSchedule(schoolId: string, id: string) {
    const schedule = await this.prisma.reportSchedule.findFirst({
      where: { id, schoolId }
    });
    if (!schedule) throw new NotFoundException('Schedule not found');

    return this.prisma.reportSchedule.delete({
      where: { id }
    });
  }
}

