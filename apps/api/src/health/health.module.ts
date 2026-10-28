import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CommunicationModule } from '../communication/communication.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    CommunicationModule,
    InventoryModule
  ],
  providers: [HealthService],
  controllers: [HealthController],
  exports: [HealthService],
})
export class HealthModule {}
