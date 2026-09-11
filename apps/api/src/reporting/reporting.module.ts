import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportsService } from './reports.service';
import { AnalyticsService } from './analytics.service';
import { ReportingController } from './reporting.controller';
import { AuditModule } from '../audit/audit.module';
import { ReportProcessor } from './processors/report.processor';
import { ReportingCronService } from './reporting-cron.service';
import { ReportingRealtimeHandler } from './handlers/reporting-realtime.handler';
import { EventDispatcherService } from '../workflow/events/event-dispatcher.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reports',
    }),
    AuditModule,
  ],
  controllers: [ReportingController],
  providers: [
    ReportsService,
    AnalyticsService,
    ReportProcessor,
    ReportingCronService,
    ReportingRealtimeHandler
  ],
  exports: [ReportsService, AnalyticsService],
})
export class ReportingModule {
  constructor(
    private eventDispatcher: EventDispatcherService,
    private realtimeHandler: ReportingRealtimeHandler,
  ) {
    const events = [
      'ADMISSION_CONFIRMED',
      'APPLICATION_SUBMITTED',
      'PAYMENT_RECEIVED',
      'INVOICE_GENERATED',
      'ATTENDANCE_MARKED',
      'RESULT_PUBLISHED',
      'STUDENT_CREATED',
      'TEACHER_CREATED',
      'WORKFLOW_FAILED'
    ];

    events.forEach(event => {
      this.eventDispatcher.register(event, ReportingRealtimeHandler);
    });
  }
}
