import { Injectable } from '@nestjs/common';
import { prisma } from '@hrm/database';

@Injectable()
export class OutboxIdempotencyService {
  async isProcessed(eventId: string) {
    const event = await prisma.outboxEvent.findUnique({ where: { id: eventId }, select: { processedAt: true } });
    return Boolean(event?.processedAt);
  }
}
