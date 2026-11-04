import { Module } from '@nestjs/common';
import { TeacherQualificationController } from './teacher-qualification.controller';
import { TeacherQualificationService } from './teacher-qualification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TeacherQualificationController],
  providers: [TeacherQualificationService],
  exports: [TeacherQualificationService],
})
export class TeacherQualificationModule {}
