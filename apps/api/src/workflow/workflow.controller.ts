import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
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
    return this.prisma.workflowInstance.findFirst({
      where: { id, schoolId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Get('events')
  async getEvents(@ActiveSchool() schoolId: string, @Query('type') type?: string) {
    return this.prisma.domainEvent.findMany({
      where: {
        schoolId,
        eventType: type,
      },
      take: 50,
      orderBy: { timestamp: 'desc' },
    });
  }

  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  @Post('workflows/:id/retry')
  async retryWorkflow(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    const workflow = await this.prisma.workflowInstance.findFirst({
      where: { id, schoolId },
      include: { steps: true }
    });

    if (!workflow) throw new Error('Workflow not found');

    // Simple retry logic: set status back to RUNNING and reset failed steps
    return this.prisma.workflowInstance.update({
      where: { id },
      data: {
        status: 'RETRYING',
        steps: {
          updateMany: {
            where: { status: 'FAILED' },
            data: { status: 'PENDING' }
          }
        }
      }
    });
  }
}
