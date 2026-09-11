import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';

import { ResultCalculationService } from './result-calculation.service';
import { ReportCardService } from './report-card.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ResultsController],
  providers: [ResultsService, ResultCalculationService, ReportCardService],
  exports: [ResultsService, ResultCalculationService, ReportCardService],
})
export class ResultsModule {}
