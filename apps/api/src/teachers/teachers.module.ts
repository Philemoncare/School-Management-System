import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { TeacherPortalService } from './teacher-portal.service';
import { TeacherPortalController } from './teacher-portal.controller';
import { TeacherTaskService } from './teacher-task.service';
import { TeacherTaskController } from './teacher-task.controller';

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
  exports: [
    TeachersService,
    TeacherAssignmentsService,
    TeacherPortalService,
    TeacherTaskService,
  ],
})
export class TeachersModule {}
