import { Global, Module } from '@nestjs/common';
import { DomainEventBus } from './domain-event.bus';
import { OutboxService } from './outbox.service';
import { OutboxIdempotencyService } from './outbox-idempotency';
import { OutboxWorker } from './outbox.worker';

@Global()
@Module({ providers: [DomainEventBus, OutboxService, OutboxIdempotencyService, OutboxWorker], exports: [DomainEventBus, OutboxService, OutboxIdempotencyService, OutboxWorker] })
export class EventsModule {}
