import { Global, Module } from '@nestjs/common';
import { DomainEventBus } from './domain-event.bus';
import { OutboxService } from './outbox.service';

@Global()
@Module({ providers: [DomainEventBus, OutboxService], exports: [DomainEventBus, OutboxService] })
export class EventsModule {}
