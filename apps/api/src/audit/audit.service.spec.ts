import { describe, expect, it, vi } from 'vitest';
import { AuditService } from './audit.service';

const auditLog = { findMany: vi.fn() };

vi.mock('@hrm/database', () => ({ prisma: { auditLog } }));

describe('AuditService', () => {
  it('rejects invalid page sizes', async () => {
    const service = new AuditService();
    await expect(service.list('org-1', { limit: 0 })).rejects.toThrow('between 1 and 100');
    await expect(service.list('org-1', { limit: 101 })).rejects.toThrow('between 1 and 100');
    await expect(service.list('org-1', { limit: 1.5 })).rejects.toThrow('between 1 and 100');
  });

  it('rejects malformed cursors', async () => {
    const service = new AuditService();
    await expect(service.list('org-1', { cursor: 'invalid' })).rejects.toThrow('Invalid audit log cursor');
  });

  it('uses a tenant-scoped compound cursor query', async () => {
    const occurredAt = new Date('2026-09-04T10:00:00.000Z');
    auditLog.findMany.mockResolvedValueOnce([
      { id: 'a', organizationId: 'org-1', occurredAt },
      { id: 'b', organizationId: 'org-1', occurredAt: new Date('2026-09-04T09:59:00.000Z') },
    ]);
    const service = new AuditService();
    const cursor = Buffer.from(JSON.stringify({ occurredAt: occurredAt.toISOString(), id: 'z' }), 'utf8').toString('base64url');
    const result = await service.list('org-1', { limit: 1, cursor });
    expect(auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-1', OR: [{ occurredAt: { lt: occurredAt } }, { occurredAt, id: { lt: 'z' } }] }), take: 2 }));
    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeTruthy();
  });
});
