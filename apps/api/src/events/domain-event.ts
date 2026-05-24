import { randomUUID } from 'node:crypto';

export interface DomainEvent {
  readonly eventId: string;
  readonly name: string;
  readonly occurredAt: Date;

  readonly actorId?: string;
  readonly actorType?: 'user' | 'admin' | 'system' | 'job';

  readonly resourceType?: string;
  readonly resourceId?: string;

  readonly payload: object;

  readonly requestId?: string;
  readonly correlationId?: string;
}

export type DomainEventContext = Partial<
  Pick<
    DomainEvent,
    'actorId' | 'actorType' | 'resourceType' | 'resourceId' | 'requestId' | 'correlationId'
  >
>;

export function createDomainEvent(
  name: string,
  payload: object,
  context?: DomainEventContext,
): DomainEvent {
  return {
    eventId: randomUUID(),
    name,
    occurredAt: new Date(),
    payload,
    ...context,
  };
}
