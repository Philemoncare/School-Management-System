import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { LifecycleService } from './lifecycle.service';
import { LifecycleController } from './lifecycle.controller';
import { StudentAccessService } from './student-access.service';

@Module({
  controllers: [StudentsController, LifecycleController],
  providers: [StudentsService, LifecycleService, StudentAccessService],
  exports: [StudentsService, LifecycleService, StudentAccessService],
})
export class StudentsModule {}
