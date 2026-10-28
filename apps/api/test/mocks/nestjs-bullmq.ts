import { Inject } from '@nestjs/common';

const queueToken = (name: string) => `BullQueue_${name}`;

class FakeQueue {
  add = async () => ({ id: 'mock-job' });
  upsertJobScheduler = async () => ({ id: 'mock-scheduler' });
  getJob = async () => null;
  getJobs = async () => [];
  remove = async () => undefined;
}

class BullRootModule {}
class BullQueueModule {}

const queueNames = (options: any) => {
  const entries = Array.isArray(options) ? options : [options];
  return entries.map((entry) => entry.name);
};

export const InjectQueue = (name: string) => Inject(queueToken(name));

export const getQueueToken = queueToken;

export const BullModule = {
  forRoot: () => ({ module: BullRootModule, global: true }),
  forRootAsync: () => ({ module: BullRootModule, global: true }),
  registerQueue: (options: any) => {
    const names = queueNames(options);
    return {
      module: BullQueueModule,
      providers: names.map((name) => ({
        provide: queueToken(name),
        useValue: new FakeQueue(),
      })),
      exports: names.map((name) => queueToken(name)),
    };
  },
};

export const Processor = () => () => undefined;

export class WorkerHost {
  async process(_job: any): Promise<any> {
    return undefined;
  }
}
