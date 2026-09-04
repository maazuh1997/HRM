import { ForbiddenException, Injectable } from '@nestjs/common';
import { prisma } from '@hrm/database';

@Injectable()
export class NotificationService {
  async list(organizationId: string, recipientUserId: string, limit = 25, cursor?: string) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new ForbiddenException('Notification limit must be between 1 and 100');
    const notifications = await prisma.notification.findMany({
      where: { organizationId, recipientUserId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = notifications.length > limit;
    return { items: notifications.slice(0, limit), nextCursor: hasMore ? notifications[limit - 1]?.id ?? null : null };
  }

  async markRead(organizationId: string, recipientUserId: string, notificationId: string) {
    const result = await prisma.notification.updateMany({ where: { id: notificationId, organizationId, recipientUserId }, data: { readAt: new Date() } });
    if (!result.count) throw new ForbiddenException('Notification not found');
    return prisma.notification.findFirst({ where: { id: notificationId, organizationId, recipientUserId } });
  }

  async markAllRead(organizationId: string, recipientUserId: string) {
    const result = await prisma.notification.updateMany({ where: { organizationId, recipientUserId, readAt: null }, data: { readAt: new Date() } });
    return { updated: result.count };
  }

  async createDelivery(organizationId: string, notificationId: string, channel: string, idempotencyKey: string) {
    const notification = await prisma.notification.findFirst({ where: { id: notificationId, organizationId }, select: { id: true } });
    if (!notification) throw new ForbiddenException('Notification not found');
    return prisma.notificationDelivery.upsert({
      where: { idempotencyKey },
      create: { organizationId, notificationId, channel, idempotencyKey },
      update: {},
    });
  }
}
