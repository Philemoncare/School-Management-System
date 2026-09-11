import { LifecycleService } from './lifecycle.service';
import { LifecycleController } from './lifecycle.controller';

@Module({
  controllers: [StudentsController, LifecycleController],
  providers: [StudentsService, LifecycleService],
  exports: [StudentsService, LifecycleService],
})
export class StudentsModule {}
