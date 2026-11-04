import { Module } from '@nestjs/common';
import { TeacherDocumentController } from './teacher-document.controller';
import { TeacherDocumentService } from './teacher-document.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TeacherDocumentController],
  providers: [TeacherDocumentService],
  exports: [TeacherDocumentService],
})
export class TeacherDocumentModule {}
