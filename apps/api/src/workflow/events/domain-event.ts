export interface DomainEventPayload {
  [key: string]: any;
}

export interface DomainEventMetadata {
  [key: string]: any;
}

export class DomainEvent<T extends DomainEventPayload = DomainEventPayload> {
  constructor(
    public readonly eventType: string,
    public readonly resourceType: string,
    public readonly resourceId: string,
    public readonly payload: T,
    public readonly schoolId?: string,
    public readonly actorUserId?: string,
    public readonly metadata?: DomainEventMetadata,
    public readonly correlationId?: string,
    public readonly causationId?: string,
    public readonly eventVersion: number = 1,
  ) {}
}
