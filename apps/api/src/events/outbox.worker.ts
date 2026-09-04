import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { DomainEventBus } from './domain-event.bus';
import type { DomainEvent } from './domain-event';

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 10;
const LEASE_SECONDS = 300;

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);

  constructor(private readonly eventBus: DomainEventBus) {}

  async processBatch() {
    const now = new Date();
    const claimed = await prisma.$transaction(async (tx) => {
      const events = await tx.$queryRaw<Array<{ id: string; organizationId: string; type: string; resourceType: string; resourceId: string; actorUserId: string | null; payload: unknown; occurredAt: Date }>>`
        SELECT "id", "organizationId", "type", "resourceType", "resourceId", "actorUserId", "payload", "occurredAt"
        FROM "OutboxEvent"
        WHERE "processedAt" IS NULL
          AND "availableAt" <= ${now}
          AND "attempts" < ${MAX_ATTEMPTS}
        ORDER BY "availableAt" ASC, "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${BATCH_SIZE}
      `;
      if (!events.length) return [];
      await tx.outboxEvent.updateMany({ where: { id: { in: events.map((event) => event.id) }, processedAt: null }, data: { attempts: { increment: 1 }, availableAt: new Date(Date.now() + LEASE_SECONDS * 1000) } });
      return events;
    });

    for (const event of claimed) await this.process(event);
    return claimed.length;
  }

  private async process(event: { id: string; organizationId: string; type: string; resourceType: string; resourceId: string; actorUserId: string | null; payload: unknown; occurredAt: Date }) {
    try {
      await this.eventBus.publish({ type: event.type as DomainEvent['type'], organizationId: event.organizationId, resourceType: event.resourceType, resourceId: event.resourceId, actorUserId: event.actorUserId ?? undefined, payload: (event.payload ?? {}) as Record<string, unknown>, occurredAt: event.occurredAt });
      await prisma.outboxEvent.updateMany({ where: { id: event.id, processedAt: null }, data: { processedAt: new Date(), lastError: null } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown outbox processing error';
      const current = await prisma.outboxEvent.findUnique({ where: { id: event.id }, select: { attempts: true } });
      const delaySeconds = Math.min(3600, 2 ** Math.max(0, (current?.attempts ?? 1) - 1));
      await prisma.outboxEvent.updateMany({ where: { id: event.id, processedAt: null }, data: { availableAt: new Date(Date.now() + delaySeconds * 1000), lastError: message.slice(0, 2000) } });
      this.logger.error(`Outbox event ${event.id} failed: ${message}`);
    }
  }
}
