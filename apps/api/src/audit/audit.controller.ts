import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../organizations/tenant.guard';
import { PermissionGuard } from '../authorization/permission.guard';
import { RequirePermission } from '../authorization/permission.decorator';
import type { TenantRequest } from '../organizations/organization-context';
import { AuditService } from './audit.service';

@Controller('audit-logs')
@UseGuards(TenantGuard, PermissionGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission('audit', 'read')
  list(@Req() req: TenantRequest, @Query('action') action?: string, @Query('resourceType') resourceType?: string, @Query('resourceId') resourceId?: string, @Query('actorUserId') actorUserId?: string, @Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.auditService.list(req.tenant!.id, { action, resourceType, resourceId, actorUserId, limit: limit ? Number(limit) : undefined, cursor });
  }
}
