import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '@hrm/database';
import type { Prisma } from '@prisma/client';

export type AuditEventInput = {
  organizationId: string;
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditListOptions = {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  actorUserId?: string;
  limit?: number;
  cursor?: string;
};

@Injectable()
export class AuditService {
  async record(input: AuditEventInput) {
    return prisma.auditLog.create({ data: input });
  }

  async recordInTransaction(tx: Prisma.TransactionClient, input: AuditEventInput) {
    return tx.auditLog.create({ data: input });
  }

  async list(organizationId: string, options: AuditListOptions = {}) {
    const limit = options.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new BadRequestException('Audit log limit must be an integer between 1 and 100');
    const cursor = options.cursor ? this.decodeCursor(options.cursor) : undefined;
    const rows = await prisma.auditLog.findMany({
      where: {
        organizationId,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        actorUserId: options.actorUserId,
        ...(cursor ? { OR: [{ occurredAt: { lt: cursor.occurredAt } }, { occurredAt: cursor.occurredAt, id: { lt: cursor.id } }] } : {}),
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? this.encodeCursor(items[items.length - 1].occurredAt, items[items.length - 1].id) : null;
    return { items, nextCursor };
  }

  private encodeCursor(occurredAt: Date, id: string) {
    return Buffer.from(JSON.stringify({ occurredAt: occurredAt.toISOString(), id }), 'utf8').toString('base64url');
  }

  private decodeCursor(value: string) {
    try {
      const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { occurredAt?: string; id?: string };
      if (!decoded.id || !decoded.occurredAt) throw new Error();
      const occurredAt = new Date(decoded.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) throw new Error();
      return { occurredAt, id: decoded.id };
    } catch {
      throw new BadRequestException('Invalid audit log cursor');
    }
  }
}
