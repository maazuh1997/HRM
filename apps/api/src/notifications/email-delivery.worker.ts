import { Inject, Injectable, Logger } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { EMAIL_PROVIDER } from './email-provider.token';
import type { EmailProvider } from './email-provider';

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 10;

@Injectable()
export class EmailDeliveryWorker {
  private readonly logger = new Logger(EmailDeliveryWorker.name);

  constructor(@Inject(EMAIL_PROVIDER) private readonly provider: EmailProvider) {}

  async processBatch() {
    const claimed = await prisma.$transaction(async (tx) => {
      const deliveries = await tx.$queryRaw<Array<{ id: string; notificationId: string; attempts: number; }>>`
        SELECT nd."id", nd."notificationId", nd."attempts"
        FROM "NotificationDelivery" nd
        WHERE nd."channel" = 'EMAIL'
          AND nd."status" = 'PENDING'
          AND nd."availableAt" <= NOW()
          AND nd."attempts" < ${MAX_ATTEMPTS}
        ORDER BY nd."availableAt" ASC, nd."createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${BATCH_SIZE}
      `;
      if (!deliveries.length) return [];
      await tx.notificationDelivery.updateMany({ where: { id: { in: deliveries.map((delivery) => delivery.id) }, status: 'PENDING' }, data: { attempts: { increment: 1 }, availableAt: new Date(Date.now() + 300000) } });
      return deliveries;
    });

    for (const delivery of claimed) await this.process(delivery.id, delivery.notificationId);
    return claimed.length;
  }

  private async process(deliveryId: string, notificationId: string) {
    try {
      const delivery = await prisma.notificationDelivery.findUnique({ where: { id: deliveryId }, select: { id: true, status: true, notification: { select: { recipient: { select: { email: true } }, title: true, body: true } } } });
      if (!delivery || delivery.status !== 'PENDING') return;
      if (!delivery.notification.recipient.email) throw new Error('Notification recipient has no email address');
      await this.provider.send({ to: delivery.notification.recipient.email, subject: delivery.notification.title, text: delivery.notification.body });
      await prisma.notificationDelivery.updateMany({ where: { id: deliveryId, status: 'PENDING' }, data: { status: 'SENT', sentAt: new Date(), lastError: null } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown email delivery error';
      const delivery = await prisma.notificationDelivery.findUnique({ where: { id: deliveryId }, select: { attempts: true, status: true } });
      if (!delivery || delivery.status !== 'PENDING') return;
      const delaySeconds = Math.min(3600, 2 ** Math.max(0, delivery.attempts - 1));
      await prisma.notificationDelivery.updateMany({ where: { id: deliveryId, status: 'PENDING' }, data: { availableAt: new Date(Date.now() + delaySeconds * 1000), lastError: message.slice(0, 2000) } });
      this.logger.error(`Email delivery ${deliveryId} failed: ${message}`);
    }
  }
}
