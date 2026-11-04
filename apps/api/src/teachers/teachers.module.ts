import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { TeacherPortalService } from './teacher-portal.service';
import { TeacherPortalController } from './teacher-portal.controller';
import { TeacherTaskService } from './teacher-task.service';
import { TeacherTaskController } from './teacher-task.controller';
import { TeacherQualificationModule } from './teacher-qualification.module';
import { TeacherCertificationModule } from './teacher-certification.module';
import { TeacherDocumentModule } from './teacher-document.module';

@Module({
  controllers: [
    TeachersController,
    TeacherAssignmentsController,
    TeacherPortalController,
    TeacherTaskController,
  ],
  providers: [
    TeachersService,
    TeacherAssignmentsService,
    TeacherPortalService,
    TeacherTaskService,
  ],
  imports: [
    TeacherQualificationModule,
    TeacherCertificationModule,
    TeacherDocumentModule,
  ],
  exports: [
    TeachersService,
    TeacherAssignmentsService,
    TeacherPortalService,
    TeacherTaskService,
  ],
})
export class TeachersModule {}
