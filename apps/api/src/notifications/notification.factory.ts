import { createHash } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { DomainEvent } from '../events/domain-event';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

export type NotificationDefinition = {
  type: string;
  title: string;
  body: string;
  recipientUserIds: string[];
  channels?: NotificationChannel[];
};

@Injectable()
export class NotificationFactory {
  async createFromEvent(tx: Prisma.TransactionClient, event: DomainEvent, definition: NotificationDefinition) {
    const recipientUserIds = [...new Set(definition.recipientUserIds.filter(Boolean))];
    if (!recipientUserIds.length) throw new BadRequestException('At least one notification recipient is required');
    if (!definition.title.trim() || !definition.body.trim()) throw new BadRequestException('Notification title and body are required');
    const channels = [...new Set(definition.channels ?? ['IN_APP'])];
    const recipients = await tx.user.findMany({ where: { id: { in: recipientUserIds }, status: 'ACTIVE', memberships: { some: { organizationId: event.organizationId, status: 'ACTIVE' } } }, select: { id: true } });
    if (recipients.length !== recipientUserIds.length) throw new BadRequestException('One or more notification recipients are not active members of the organization');
    const created: Array<{ id: string; recipientUserId: string }> = [];
    for (const recipientUserId of recipients.map((recipient) => recipient.id)) {
      const notificationId = createHash('sha256').update(`${event.idempotencyKey ?? `${event.type}:${event.resourceType}:${event.resourceId}:${event.occurredAt.toISOString()}`}:${recipientUserId}`).digest('hex');
      const notification = await tx.notification.upsert({
        where: { id: notificationId },
        create: { id: notificationId, organizationId: event.organizationId, recipientUserId, type: definition.type, title: definition.title.trim(), body: definition.body.trim(), resourceType: event.resourceType, resourceId: event.resourceId },
        update: {},
      });
      for (const channel of channels) {
        const idempotencyKey = `${notification.id}:${channel}`;
        await tx.notificationDelivery.upsert({
          where: { idempotencyKey },
          create: { organizationId: event.organizationId, notificationId: notification.id, channel, status: channel === 'IN_APP' ? 'SENT' : 'PENDING', sentAt: channel === 'IN_APP' ? new Date() : undefined, idempotencyKey },
          update: {},
        });
      }
      created.push({ id: notification.id, recipientUserId });
    }
    return created;
  }
}
