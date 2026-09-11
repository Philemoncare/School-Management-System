import { Module } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { ScoresService } from './scores.service';
import { AssessmentsController } from './assessments.controller';

@Module({
  controllers: [AssessmentsController],
  providers: [AssessmentsService, ScoresService],
  exports: [AssessmentsService, ScoresService],
})
export class AssessmentsModule {}
