import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('super-admin/plans')
export class SuperAdminPlansController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      include: { pricing: true }
    });
  }

  @Post()
  async createPlan(@Body() dto: any, @CurrentUser() user: any) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        trialDays: dto.trialDays || 0,
        features: dto.features || {},
        pricing: {
          create: dto.pricing || []
        }
      }
    });

    await this.audit.log({
      userId: user.id,
      action: 'PLAN_CREATED',
      module: 'BILLING',
      resourceId: plan.id,
      metadata: { code: plan.code }
    });

    return plan;
  }

  @Patch(':id')
  async updatePlan(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: dto
    });

    await this.audit.log({
      userId: user.id,
      action: 'PLAN_UPDATED',
      module: 'BILLING',
      resourceId: plan.id,
      metadata: dto
    });

    return plan;
  }
}
