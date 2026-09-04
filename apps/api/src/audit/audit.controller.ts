import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
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
    const parsedLimit = limit === undefined ? undefined : Number(limit);
    if (parsedLimit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100)) throw new BadRequestException('limit must be an integer between 1 and 100');
    if (cursor !== undefined && !cursor.trim()) throw new BadRequestException('cursor cannot be empty');
    const filters = { action, resourceType, resourceId, actorUserId, limit: parsedLimit, cursor: cursor?.trim() };
    for (const [key, value] of Object.entries(filters)) if (typeof value === 'string' && value.length > 200) throw new BadRequestException(`${key} is too long`);
    return this.auditService.list(req.tenant!.id, filters);
  }
}
