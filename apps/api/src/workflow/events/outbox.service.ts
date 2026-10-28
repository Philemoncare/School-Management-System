import { Injectable } from '@nestjs/common';
import { DomainEvent } from './domain-event';
import { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OutboxService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('outbox') private outboxQueue: Queue,
  ) {}

  async onModuleInit() {
    try {
      await Promise.race([
        this.outboxQueue.upsertJobScheduler(
          'outbox-process',
          { every: 10000 },
          {
            name: 'process',
            data: {},
            opts: { removeOnComplete: true },
          },
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Outbox queue timeout')), 1000)),
      ]);
    } catch {
      // Safely ignore queue error/timeout if Redis is offline
    }
  }

  /**
   * Dispatches an event by saving it to the outbox.
   * This should be called within a Prisma transaction.
   */
  async dispatch(event: DomainEvent, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;

    return client.outboxEvent.create({
      data: {
        schoolId: event.schoolId,
        eventType: event.eventType,
        payload: event.payload as any,
        metadata: {
          ...event.metadata,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          actorUserId: event.actorUserId,
          correlationId: event.correlationId,
          causationId: event.causationId,
          eventVersion: event.eventVersion,
        } as any,
      },
    });
  }
}
