import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { ApprovalService } from './approval.service';

@Controller('approvals')
@UseGuards(AuthGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('pending')
  listPending(@CurrentUser() user: AuthenticatedUser, @Headers('x-organization-id') organizationId: string) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.approvalService.listPendingForApprover(organizationId, user.id);
  }
}
