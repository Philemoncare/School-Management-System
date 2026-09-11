import { AdmissionConfirmedHandler } from './events/handlers/admission-confirmed.handler';
import { StudentPromotedHandler } from './events/handlers/student-promoted.handler';
import { TeacherCreatedHandler } from './events/handlers/teacher-created.handler';
import { StudentLifecycleHandler } from './events/handlers/student-lifecycle.handler';
import { StaffLifecycleHandler } from './events/handlers/staff-lifecycle.handler';
import { ResultPublishedHandler } from './events/handlers/result-published.handler';
import { FinanceModule } from '../finance/finance.module';
import { WorkflowController } from './workflow.controller';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'outbox',
    }),
    FinanceModule,
  ],
  controllers: [WorkflowController],
  providers: [
    WorkflowService,
    OutboxService,
    OutboxProcessor,
    EventDispatcherService,
    AdmissionConfirmedHandler,
    StudentPromotedHandler,
    TeacherCreatedHandler,
    StudentLifecycleHandler,
    StaffLifecycleHandler,
    ResultPublishedHandler,
  ],
  exports: [
    WorkflowService,
    OutboxService,
    EventDispatcherService,
  ],
})
export class WorkflowModule {
  constructor(
    private eventDispatcher: EventDispatcherService,
    private admissionConfirmedHandler: AdmissionConfirmedHandler,
    private studentPromotedHandler: StudentPromotedHandler,
    private teacherCreatedHandler: TeacherCreatedHandler,
    private studentLifecycleHandler: StudentLifecycleHandler,
    private staffLifecycleHandler: StaffLifecycleHandler,
    private resultPublishedHandler: ResultPublishedHandler,
  ) {
    this.eventDispatcher.register('ADMISSION_CONFIRMED', AdmissionConfirmedHandler);
    this.eventDispatcher.register('STUDENT_PROMOTED', StudentPromotedHandler);
    this.eventDispatcher.register('TEACHER_CREATED', TeacherCreatedHandler);
    this.eventDispatcher.register('STUDENT_WITHDRAWN', StudentLifecycleHandler);
    this.eventDispatcher.register('STUDENT_GRADUATED', StudentLifecycleHandler);
    this.eventDispatcher.register('STUDENT_TRANSFERRED', StudentLifecycleHandler);
    this.eventDispatcher.register('STAFF_TERMINATED', StaffLifecycleHandler);
    this.eventDispatcher.register('STAFF_OFFBOARDED', StaffLifecycleHandler);
    this.eventDispatcher.register('RESULT_PUBLISHED', ResultPublishedHandler);
  }
}
