import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { BillingService } from './billing.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, BillingService],
  exports: [SubscriptionsService, BillingService],
})
export class SubscriptionsModule {}
