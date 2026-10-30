import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { SchoolSmsController } from './school-sms.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [SmsService],
  controllers: [SmsController, SchoolSmsController],
  exports: [SmsService],
})
export class SmsModule {}
