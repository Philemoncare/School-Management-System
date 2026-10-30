import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('operations')
export class WorkflowController {
  constructor(private prisma: PrismaService) {}

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Get('dashboard')
  async getDashboard(@ActiveSchool() schoolId: string) {
    const [workflows, activeStudents, pendingApps, totalEnrollments] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where: { schoolId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { steps: true },
      }),
      this.prisma.student.count({ where: { schoolId, status: 'ACTIVE' } }),
      this.prisma.admissionApplication.count({ where: { schoolId, status: 'SUBMITTED' } }),
      this.prisma.enrollment.count({ where: { schoolId, status: 'ACTIVE' } }),
    ]);

    return {
      metrics: {
        activeStudents,
        pendingApplications: pendingApps,
        currentEnrollments: totalEnrollments,
      },
      recentWorkflows: workflows,
    };
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Get('workflows')
  async getWorkflows(
    @ActiveSchool() schoolId: string,
    @Query('status') status?: any,
    @Query('type') type?: string,
  ) {
    return this.prisma.workflowInstance.findMany({
      where: {
        schoolId,
        status,
        workflowType: type,
      },
      include: { steps: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Get('workflows/:id')
  async getWorkflow(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    const workflow = await this.prisma.workflowInstance.findFirst({
      where: { id, schoolId },
      include: {
        steps: { orderBy: { order: 'asc' } },
      },
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found.');
    }
    return workflow;
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Get('events')
  async getEvents(
    @ActiveSchool() schoolId: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(200, Math.max(1, Number(limit) || 50));
    const trimmedSearch = typeof search === 'string' ? search.trim() : '';

    return this.prisma.domainEvent.findMany({
      where: {
        schoolId,
        ...(type && type.trim() ? { eventType: type.trim() } : {}),
        ...(trimmedSearch
          ? {
              OR: [
                { eventType: { contains: trimmedSearch, mode: 'insensitive' as const } },
                { resourceType: { contains: trimmedSearch, mode: 'insensitive' as const } },
                { resourceId: { contains: trimmedSearch, mode: 'insensitive' as const } },
                { correlationId: { contains: trimmedSearch, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        processingRecords: {
          select: { id: true, handlerName: true, status: true, processedAt: true, retryCount: true, errorInfo: true },
        },
      },
    });
  }
}
