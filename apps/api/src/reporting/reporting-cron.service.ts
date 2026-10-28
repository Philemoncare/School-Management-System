import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingCronService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('reports') private reportQueue: Queue,
  ) {}

  async onModuleInit() {
    try {
      await Promise.race([
        (async () => {
          await this.syncSchedules();
          await this.setupSnapshotCron();
        })(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cron queue timeout')), 1000)),
      ]);
    } catch {
      // Safely ignore queue error/timeout if Redis is offline
    }
  }

  async setupSnapshotCron() {
      // Run daily snapshots at midnight
      await this.reportQueue.upsertJobScheduler(
          'periodic-snapshots',
          { pattern: '0 0 * * *' },
          {
              name: 'periodic-snapshots',
              data: {},
              opts: { removeOnComplete: true },
          }
      );
  }

  async syncSchedules() {
    const schedules = await this.prisma.reportSchedule.findMany({
      where: { isActive: true },
    });

    for (const schedule of schedules) {
      const cron = this.mapFrequencyToCron(schedule);
      await this.reportQueue.upsertJobScheduler(
        `schedule-${schedule.id}`,
        {
          pattern: cron,
          tz: schedule.timezone || 'UTC',
        },
        {
          name: 'scheduled-report',
          data: { scheduleId: schedule.id },
          opts: { removeOnComplete: true },
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
