import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditService {
  async record(input: AuditEventInput) {
    return prisma.auditLog.create({ data: input });
  }

  async recordInTransaction(tx: Prisma.TransactionClient, input: AuditEventInput) {
    return tx.auditLog.create({ data: input });
  }

  async list(organizationId: string, options: { action?: string; resourceType?: string; resourceId?: string; actorUserId?: string; limit?: number; cursor?: string } = {}) {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    return prisma.auditLog.findMany({
      where: {
        organizationId,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        actorUserId: options.actorUserId,
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(options.cursor ? { skip: 1, cursor: { id: options.cursor } } : {}),
    });
  }
}
