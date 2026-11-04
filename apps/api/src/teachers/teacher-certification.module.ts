import { Module } from '@nestjs/common';
import { TeacherCertificationController } from './teacher-certification.controller';
import { TeacherCertificationService } from './teacher-certification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [TeacherCertificationController],
  providers: [TeacherCertificationService],
  exports: [TeacherCertificationService],
})
export class TeacherCertificationModule {}
