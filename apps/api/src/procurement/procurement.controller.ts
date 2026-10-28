import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('procurement')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('dashboard')
  @Roles('SCHOOL_ADMIN', 'PROCUREMENT_OFFICER')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.procurementService.getDashboard(schoolId);
  }

  @Get('suppliers')
  @Roles('SCHOOL_ADMIN', 'PROCUREMENT_OFFICER')
  getSuppliers(@ActiveSchool() schoolId: string) {
    return this.procurementService.getSuppliers(schoolId);
  }

  @Post('suppliers')
  @Roles('SCHOOL_ADMIN', 'PROCUREMENT_OFFICER')
  createSupplier(@ActiveSchool() schoolId: string, @Body() dto: any) {
    return this.procurementService.createSupplier(schoolId, dto);
  }

  @Get('requests')
  @Roles('SCHOOL_ADMIN', 'PROCUREMENT_OFFICER', 'TEACHER', 'STAFF')
  getRequests(@ActiveSchool() schoolId: string) {
    return this.procurementService.getPurchaseRequests(schoolId);
  }

  @Post('requests')
  @Roles('SCHOOL_ADMIN', 'PROCUREMENT_OFFICER', 'TEACHER', 'STAFF')
  createRequest(@ActiveSchool() schoolId: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.procurementService.createPurchaseRequest(schoolId, user.id, dto);
  }

  @Get('orders')
  @Roles('SCHOOL_ADMIN', 'PROCUREMENT_OFFICER')
  getOrders(@ActiveSchool() schoolId: string) {
    return this.procurementService.getPurchaseOrders(schoolId);
  }

  @Post('orders')
  @Roles('SCHOOL_ADMIN', 'PROCUREMENT_OFFICER')
  createOrder(@ActiveSchool() schoolId: string, @Body() dto: any) {
    return this.procurementService.createPurchaseOrder(schoolId, dto);
  }

  @Post('receive')
  @Roles('SCHOOL_ADMIN', 'PROCUREMENT_OFFICER', 'STOREKEEPER')
  receiveGoods(@ActiveSchool() schoolId: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.procurementService.receiveGoods(schoolId, user.id, dto);
  }
}
