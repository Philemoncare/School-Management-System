import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subService: SubscriptionsService) {}

  // --- Public / General ---

  @Get('plans')
  findAllPlans() {
    return this.subService.findAllPlans();
  }

  // --- School / Tenant Level ---

  @Roles('SCHOOL_ADMIN')
  @UseGuards(TenantGuard)
  @Get('my-subscription')
  getSchoolSubscription(@ActiveSchool() schoolId: string) {
    return this.subService.getSchoolSubscription(schoolId);
  }

  @Roles('SCHOOL_ADMIN')
  @UseGuards(TenantGuard)
  @Post('subscribe/:planId')
  subscribe(
    @ActiveSchool() schoolId: string,
    @Param('planId') planId: string,
    @CurrentUser() user: any
  ) {
    return this.subService.subscribe(schoolId, planId, user.id);
  }

  @Roles('SCHOOL_ADMIN')
  @UseGuards(TenantGuard)
  @Post('upgrade/:pricingId')
  upgrade(
    @ActiveSchool() schoolId: string,
    @Param('pricingId') pricingId: string,
    @CurrentUser() user: any
  ) {
    return this.subService.upgrade(schoolId, pricingId, user.id);
  }

  @Roles('SCHOOL_ADMIN')
  @UseGuards(TenantGuard)
  @Post('downgrade/:pricingId')
  downgrade(
    @ActiveSchool() schoolId: string,
    @Param('pricingId') pricingId: string,
    @CurrentUser() user: any
  ) {
    return this.subService.downgrade(schoolId, pricingId, user.id);
  }

  @Roles('SCHOOL_ADMIN')
  @UseGuards(TenantGuard)
  @Delete('cancel')
  cancel(
    @ActiveSchool() schoolId: string,
    @Query('mode') mode: 'IMMEDIATE' | 'PERIOD_END',
    @Body('reason') reason: string,
    @CurrentUser() user: any
  ) {
    return this.subService.cancel(schoolId, mode || 'PERIOD_END', reason, user.id);
  }

  @Roles('SCHOOL_ADMIN')
  @UseGuards(TenantGuard)
  @Get('usage')
  getUsage(@ActiveSchool() schoolId: string) {
    return this.subService.getUsage(schoolId);
  }

  // --- Super Admin Level ---

  @Roles('SUPER_ADMIN')
  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto, @CurrentUser() user: any) {
    return this.subService.createPlan(dto, user.id);
  }

  @Roles('SUPER_ADMIN')
  @Patch('plans/:id')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: any
  ) {
    return this.subService.updatePlan(id, dto, user.id);
  }
}
