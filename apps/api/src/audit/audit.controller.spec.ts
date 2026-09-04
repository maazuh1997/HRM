import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AuditController } from './audit.controller';

const auditService = { list: vi.fn() };

describe('AuditController', () => {
  it('uses the validated tenant context', async () => {
    auditService.list.mockResolvedValueOnce({ items: [], nextCursor: null });
    const controller = new AuditController(auditService as never);
    await controller.list({ tenant: { id: 'org-1' } } as never, undefined, undefined, undefined, undefined, '25', undefined);
    expect(auditService.list).toHaveBeenCalledWith('org-1', expect.objectContaining({ limit: 25 }));
  });

  it('rejects invalid limits at the controller boundary', async () => {
    const controller = new AuditController(auditService as never);
    await expect(controller.list({ tenant: { id: 'org-1' } } as never, undefined, undefined, undefined, undefined, '1.5', undefined)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects empty cursors', async () => {
    const controller = new AuditController(auditService as never);
    await expect(controller.list({ tenant: { id: 'org-1' } } as never, undefined, undefined, undefined, undefined, undefined, '   ')).rejects.toBeInstanceOf(BadRequestException);
  });
});
