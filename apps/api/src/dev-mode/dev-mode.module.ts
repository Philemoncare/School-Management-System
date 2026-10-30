import { Module } from '@nestjs/common';
import { DevModeService } from './dev-mode.service';
import { DevModeController } from './dev-mode.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { HealthModule } from '../health/health.module';
import { SettingsModule } from '../settings/settings.module';
import { SmsModule } from '../sms/sms.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    HealthModule,
    SettingsModule,
    SmsModule,
    SubscriptionsModule,
    RedisModule,
  ],
  providers: [DevModeService],
  controllers: [DevModeController],
  exports: [DevModeService],
})
export class DevModeModule {}
