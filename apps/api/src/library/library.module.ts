import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { CommunicationModule } from '../communication/communication.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CommunicationModule, AuditModule],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
