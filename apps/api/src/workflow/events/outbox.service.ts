import { DomainEvent } from './domain-event';
import { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OutboxService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('outbox') private outboxQueue: Queue,
  ) {}

  async onModuleInit() {
    // Add a repeatable job to process the outbox every 10 seconds
    await this.outboxQueue.add('process', {}, {
      repeat: {
        every: 10000,
      },
      removeOnComplete: true,
    });
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
