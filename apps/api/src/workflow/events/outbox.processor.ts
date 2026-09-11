import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventDispatcherService } from './event-dispatcher.service';

@Processor('outbox')
@Injectable()
export class OutboxProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private prisma: PrismaService,
    private eventDispatcher: EventDispatcherService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const pendingEvents = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    for (const event of pendingEvents) {
      try {
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'PROCESSING' },
        });

        // Dispatch to internal handlers
        await this.eventDispatcher.handle(event);

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'COMPLETED', processedAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`Failed to process outbox event ${event.id}: ${error.message}`);
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'FAILED', error: error.message },
        });
      }
    }
  }
}
