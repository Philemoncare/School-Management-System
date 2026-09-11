import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowStatus, StepStatus } from '@prisma/client';

export interface WorkflowDefinition {
  type: string;
  steps: string[];
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(private prisma: PrismaService) {}

  async startWorkflow(schoolId: string, type: string, steps: string[], context: any, correlationId?: string) {
    return this.prisma.workflowInstance.create({
      data: {
        schoolId,
        workflowType: type,
        status: 'RUNNING',
        context: context as any,
        correlationId,
        steps: {
          create: steps.map((name, index) => ({
            name,
            order: index,
            status: 'PENDING',
          })),
        },
      },
      include: { steps: true },
    });
  }

  async updateStep(workflowId: string, stepName: string, status: StepStatus, metadata?: any, errorInfo?: string) {
    const step = await this.prisma.workflowStep.findUnique({
      where: {
        workflowInstanceId_name: {
          workflowInstanceId: workflowId,
          name: stepName,
        },
      },
    });

    if (!step) return;

    return this.prisma.workflowStep.update({
      where: { id: step.id },
      data: {
        status,
        metadata: metadata ? (metadata as any) : undefined,
        errorInfo,
        startedAt: status === 'IN_PROGRESS' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  async completeWorkflow(workflowId: string) {
    return this.prisma.workflowInstance.update({
      where: { id: workflowId },
      data: { status: 'COMPLETED' },
    });
  }

  async failWorkflow(workflowId: string, errorInfo?: string) {
    return this.prisma.workflowInstance.update({
      where: { id: workflowId },
      data: { status: 'FAILED' },
    });
  }
}
