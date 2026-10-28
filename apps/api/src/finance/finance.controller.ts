import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceDashboardService } from './finance-dashboard.service';
import { FeeService } from './fee.service';
import { BillingService } from './billing.service';
import { PaymentService } from './payment.service';
import { RefundService } from './refund.service';
import { FinancialAdjustmentService } from './financial-adjustment.service';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ActiveSchool } from '../auth/decorators/active-school.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly dashboardService: FinanceDashboardService,
    private readonly feeService: FeeService,
    private readonly billingService: BillingService,
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
    private readonly adjustmentService: FinancialAdjustmentService,
    private readonly ledgerService: LedgerService,
  ) {}

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('dashboard')
  getDashboard(@ActiveSchool() schoolId: string) {
    return this.dashboardService.getAccountantMetrics(schoolId);
  }

  // Fees
  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('fee-categories')
  getCategories(@ActiveSchool() schoolId: string) {
    return this.feeService.findAllCategories(schoolId);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Post('fee-categories')
  createCategory(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.feeService.createCategory(schoolId, dto, user.id);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Patch('fee-categories/:id')
  updateCategory(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.feeService.updateCategory(schoolId, id, dto, user.id);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('fee-structures')
  getStructures(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.feeService.findStructures(schoolId, filters);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Post('fee-structures')
  createStructure(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.feeService.createStructure(schoolId, dto, user.id);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Patch('fee-structures/:id')
  updateStructure(
    @ActiveSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.feeService.updateStructure(schoolId, id, dto, user.id);
  }

  // Invoices & Billing
  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Post('invoices')
  createInvoice(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.billingService.createIndividualInvoice(schoolId, dto, user.id);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Post('billing/bulk')
  startBulkBilling(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.billingService.startBulkBilling(schoolId, dto, user.id);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('invoices')
  getInvoices(@ActiveSchool() schoolId: string, @Query() filters: any) {
    // Basic implementation, should add pagination and better filtering
    return this.financeService.findAllInvoices(schoolId, filters);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('invoices/:id')
  getInvoice(@ActiveSchool() schoolId: string, @Param('id') id: string) {
    return this.financeService.findOneInvoice(schoolId, id);
  }

  // Payments
  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Post('payments/record')
  recordPayment(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.paymentService.recordManualPayment(schoolId, dto, user.id);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('payments')
  getPayments(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.paymentService.getPayments(schoolId, filters);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('receipts')
  getReceipts(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.financeService.findAllReceipts(schoolId, filters);
  }

  // Refunds & Adjustments
  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Post('refunds')
  processRefund(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.refundService.processRefund(schoolId, dto, user.id);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Post('adjustments')
  createAdjustment(@ActiveSchool() schoolId: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.adjustmentService.createAdjustment(schoolId, dto, user.id);
  }

  // Ledger
  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('ledger')
  getLedger(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.ledgerService.getLedger(schoolId, filters);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN', 'PRINCIPAL')
  @Get('students/:studentId/statement')
  getStudentStatement(
    @ActiveSchool() schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.financeService.getStudentStatement(schoolId, studentId);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('outstanding')
  getOutstanding(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.financeService.getOutstandingBalances(schoolId, filters);
  }

  // Reports
  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('reports/summary')
  getFinancialReport(@ActiveSchool() schoolId: string) {
    return this.dashboardService.getFinancialReport(schoolId);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('reports/collections')
  getCollectionReport(@ActiveSchool() schoolId: string, @Query() filters: any) {
    return this.paymentService.getPayments(schoolId, filters);
  }

  @Roles('ACCOUNTANT', 'SCHOOL_ADMIN')
  @Get('billing-runs')
  getBillingRuns(@ActiveSchool() schoolId: string) {
    return this.billingService.findAllRuns(schoolId);
  }
}
