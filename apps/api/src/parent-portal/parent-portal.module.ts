import { Module } from '@nestjs/common';
import { ParentPortalController } from './parent-portal.controller';
import { ParentPortalService } from './parent-portal.service';
import { GuardiansModule } from '../guardians/guardians.module';
import { AcademicsModule } from '../academics/academics.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { ResultsModule } from '../results/results.module';
import { FinanceModule } from '../finance/finance.module';
import { TransportModule } from '../transport/transport.module';
import { LibraryModule } from '../library/library.module';
import { CommunicationModule } from '../communication/communication.module';
import { TimetableModule } from '../timetable/timetable.module';

@Module({
  imports: [
    GuardiansModule,
    AcademicsModule,
    AttendanceModule,
    ResultsModule,
    FinanceModule,
    TransportModule,
    LibraryModule,
    CommunicationModule,
    TimetableModule,
  ],
  controllers: [ParentPortalController],
  providers: [ParentPortalService],
})
export class ParentPortalModule {}
