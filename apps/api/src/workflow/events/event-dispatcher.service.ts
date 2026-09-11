import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxEvent } from '@prisma/client';

export interface EventHandler {
  handle(event: OutboxEvent): Promise<void>;
}

@Injectable()
export class EventDispatcherService {
  private readonly logger = new Logger(EventDispatcherService.name);
  private handlers: Map<string, Type<EventHandler>[]> = new Map();

  constructor(
    private prisma: PrismaService,
    private moduleRef: ModuleRef,
  ) {}

  register(eventType: string, handler: Type<EventHandler>) {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async handle(outboxEvent: OutboxEvent) {
    const handlers = this.handlers.get(outboxEvent.eventType);
    if (!handlers) {
      this.logger.debug(`No handlers registered for event type: ${outboxEvent.eventType}`);
      return;
    }

    // Persist as DomainEvent for history and traceability if not already done
    const domainEvent = await this.prisma.domainEvent.create({
      data: {
        schoolId: outboxEvent.schoolId,
        eventType: outboxEvent.eventType,
        payload: outboxEvent.payload as any,
        metadata: outboxEvent.metadata as any,
        resourceType: (outboxEvent.metadata as any)?.resourceType || 'UNKNOWN',
        resourceId: (outboxEvent.metadata as any)?.resourceId || 'UNKNOWN',
        actorUserId: (outboxEvent.metadata as any)?.actorUserId,
        correlationId: (outboxEvent.metadata as any)?.correlationId,
        causationId: (outboxEvent.metadata as any)?.causationId,
        eventVersion: (outboxEvent.metadata as any)?.eventVersion || 1,
      },
    });

    for (const handlerType of handlers) {
      const handlerName = handlerType.name;

      // Idempotency check
      const existingRecord = await this.prisma.eventProcessingRecord.findUnique({
        where: {
          eventId_handlerName: {
            eventId: domainEvent.id,
            handlerName,
          },
        },
      });

      if (existingRecord?.status === 'COMPLETED') {
        continue;
      }

      const record = await this.prisma.eventProcessingRecord.upsert({
        where: {
          eventId_handlerName: {
            eventId: domainEvent.id,
            handlerName,
          },
        },
        update: { status: 'PROCESSING' },
        create: {
          eventId: domainEvent.id,
          handlerName,
          status: 'PROCESSING',
        },
      });

      try {
        const handlerInstance = await this.moduleRef.get(handlerType, { strict: false });
        await handlerInstance.handle(outboxEvent);

        await this.prisma.eventProcessingRecord.update({
          where: { id: record.id },
          data: { status: 'COMPLETED', processedAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`Handler ${handlerName} failed for event ${domainEvent.id}: ${error.message}`);
        await this.prisma.eventProcessingRecord.update({
          where: { id: record.id },
          data: {
            status: 'FAILED',
            errorInfo: error.message,
            retryCount: { increment: 1 }
          },
        });
        throw error; // Rethrow to let the outbox processor handle failure
      }
    }
  }
}
