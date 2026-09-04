import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { DomainEvent } from './domain-event';

@Injectable()
export class OutboxService {
  async enqueueInTransaction(tx: Prisma.TransactionClient, event: DomainEvent) {
    return tx.outboxEvent.create({
      data: {
        organizationId: event.organizationId,
        type: event.type,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        actorUserId: event.actorUserId,
        payload: event.payload as Prisma.InputJsonValue,
        occurredAt: event.occurredAt,
      },
    });
  }
}
