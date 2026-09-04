import { Injectable } from '@nestjs/common';
import type { DomainEvent, DomainEventType } from './domain-event';

type Handler = (event: DomainEvent) => Promise<void> | void;

@Injectable()
export class DomainEventBus {
  private readonly handlers = new Map<DomainEventType, Handler[]>();

  subscribe(type: DomainEventType, handler: Handler) {
    const handlers = this.handlers.get(type) ?? [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  async publish(event: DomainEvent) {
    for (const handler of this.handlers.get(event.type) ?? []) await handler(event);
  }
}
