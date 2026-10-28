import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { SuperAdminService } from '../super-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PLATFORM_OPERATOR_ROLES } from '../../auth/platform-roles';
import { PlatformInvoiceStatus, PlatformPaymentStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PLATFORM_OPERATOR_ROLES)
@Controller('super-admin/billing')
export class SuperAdminBillingController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('summary')
  getSummary() {
    return this.superAdminService.getBillingMetrics();
  }

  @Get('invoices')
  getInvoices(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: PlatformInvoiceStatus,
  ) {
    return this.superAdminService.getInvoices({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      status,
    });
  }

  @Get('payments')
  getPayments(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('status') status?: PlatformPaymentStatus,
  ) {
    return this.superAdminService.getPayments({
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      search,
      status,
    });
  }

  @Post('invoices/:id/void')
  voidInvoice(@Param('id') id: string, @CurrentUser() user: any) {
    return this.superAdminService.voidInvoice(id, user.id);
  }
}
