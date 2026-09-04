import { Global, Module } from '@nestjs/common';
import { DomainEventBus } from './domain-event.bus';
import { OutboxService } from './outbox.service';
import { OutboxWorker } from './outbox.worker';

@Global()
@Module({ providers: [DomainEventBus, OutboxService, OutboxWorker], exports: [DomainEventBus, OutboxService, OutboxWorker] })
export class EventsModule {}
