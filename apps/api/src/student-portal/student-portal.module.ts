import { Module } from '@nestjs/common';
import { StudentPortalController } from './student-portal.controller';
import { StudentPortalService } from './student-portal.service';
import { StudentsModule } from '../students/students.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [StudentsModule, AuditModule],
  controllers: [StudentPortalController],
  providers: [StudentPortalService],
})
export class StudentPortalModule {}
