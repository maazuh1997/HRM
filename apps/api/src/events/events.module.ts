import { Global, Module } from '@nestjs/common';
import { DomainEventBus } from './domain-event.bus';
import { OutboxService } from './outbox.service';
import { OutboxIdempotencyService } from './outbox-idempotency';
import { OutboxWorker } from './outbox.worker';
import { JobRunner } from '../jobs/job.runner';

@Global()
@Module({ providers: [DomainEventBus, OutboxService, OutboxIdempotencyService, OutboxWorker, JobRunner], exports: [DomainEventBus, OutboxService, OutboxIdempotencyService, OutboxWorker, JobRunner] })
export class EventsModule {}
