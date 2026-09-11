import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingCronService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('reports') private reportQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.syncSchedules();
    await this.setupSnapshotCron();
  }

  async setupSnapshotCron() {
      // Run daily snapshots at midnight
      await this.reportQueue.add(
          'periodic-snapshots',
          {},
          {
              repeat: { pattern: '0 0 * * *' },
              jobId: 'periodic-snapshots',
          }
      );
  }

  async syncSchedules() {
    const schedules = await this.prisma.reportSchedule.findMany({
      where: { isActive: true },
    });

    for (const schedule of schedules) {
      const cron = this.mapFrequencyToCron(schedule);
      await this.reportQueue.add(
        'scheduled-report',
        { scheduleId: schedule.id },
        {
          repeat: {
            pattern: cron,
            tz: schedule.timezone || 'UTC',
          },
          jobId: `schedule-${schedule.id}`,
          removeOnComplete: true,
        },
      );
    }
  }

  private mapFrequencyToCron(schedule: any): string {
    const { frequency, time, dayOfWeek, dayOfMonth } = schedule;
    const [hour, minute] = time.split(':');

    switch (frequency) {
      case 'DAILY':
        return `${minute} ${hour} * * *`;
      case 'WEEKLY':
        return `${minute} ${hour} * * ${dayOfWeek ?? 1}`;
      case 'MONTHLY':
        return `${minute} ${hour} ${dayOfMonth ?? 1} * *`;
      case 'QUARTERLY':
        return `${minute} ${hour} ${dayOfMonth ?? 1} */3 *`;
      case 'ANNUALLY':
        return `${minute} ${hour} ${dayOfMonth ?? 1} 1 *`;
      default:
        return `0 0 * * *`;
    }
  }
}
