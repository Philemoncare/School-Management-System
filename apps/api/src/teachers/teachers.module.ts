import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { TeacherAssignmentsController } from './teacher-assignments.controller';
import { TeacherPortalService } from './teacher-portal.service';
import { TeacherPortalController } from './teacher-portal.controller';

@Module({
  controllers: [
    TeachersController,
    TeacherAssignmentsController,
    TeacherPortalController
  ],
  providers: [
    TeachersService,
    TeacherAssignmentsService,
    TeacherPortalService
  ],
  exports: [
    TeachersService,
    TeacherAssignmentsService,
    TeacherPortalService
  ],
})
export class TeachersModule {}
