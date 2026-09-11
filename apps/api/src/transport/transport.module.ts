import { Module } from '@nestjs/common';
import { TransportService } from './transport.service';
import { TransportController } from './transport.controller';

import { AuditModule } from '../audit/audit.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [AuditModule, CommunicationModule],
  controllers: [TransportController],
  providers: [TransportService],
  exports: [TransportService],
})
export class TransportModule {}
