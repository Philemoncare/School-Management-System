import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PLATFORM_OPERATOR_ROLES } from '../../auth/platform-roles';
import { CreatePlanDto, UpdatePlanDto } from '../dto/super-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_OPERATOR_ROLES)
@Controller('super-admin/plans')
export class SuperAdminPlansController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get()
  getPlans() {
    return this.superAdminService.getPlans();
  }

  @Post()
  createPlan(@Body() dto: CreatePlanDto, @CurrentUser() user: any) {
    return this.superAdminService.createPlan(dto, user.id);
  }

  @Patch(':id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto, @CurrentUser() user: any) {
    return this.superAdminService.updatePlan(id, dto, user.id);
  }

  @Post(':id/archive')
  archivePlan(@Param('id') id: string, @CurrentUser() user: any) {
    return this.superAdminService.archivePlan(id, user.id);
  }
}
