import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { LedgerService } from './ledger.service';
import { FinanceDashboardService } from './finance-dashboard.service';
import { FeeService } from './fee.service';
import { BillingService } from './billing.service';
import { PaymentService } from './payment.service';
import { FinancialAdjustmentService } from './financial-adjustment.service';
import { RefundService } from './refund.service';

@Module({
  controllers: [FinanceController],
  providers: [
    FinanceService,
    LedgerService,
    FinanceDashboardService,
    FeeService,
    BillingService,
    PaymentService,
    FinancialAdjustmentService,
    RefundService,
  ],
  exports: [
    FinanceService,
    LedgerService,
    FinanceDashboardService,
    FeeService,
    BillingService,
    PaymentService,
    FinancialAdjustmentService,
    RefundService,
  ],
})
export class FinanceModule {}
