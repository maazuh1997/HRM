import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { ApprovalService } from './approval.service';
import { TenantGuard } from '../organizations/tenant.guard';
import { PermissionGuard } from '../authorization/permission.guard';
import { RequirePermission } from '../authorization/permission.decorator';
import type { TenantRequest } from '../organizations/organization-context';

@Controller('approvals')
@UseGuards(TenantGuard, PermissionGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('pending')
  @RequirePermission('leave', 'approve')
  listPending(@Req() req: TenantRequest, @CurrentUser() user: AuthenticatedUser) {
    return this.approvalService.listPendingForApprover(req.tenant!.id, user.id);
  }
}
