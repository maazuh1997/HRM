import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { TenantGuard } from '../organizations/tenant.guard';
import { PermissionGuard } from '../authorization/permission.guard';
import { RequirePermission } from '../authorization/permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import type { TenantRequest } from '../organizations/organization-context';

class CreateLeaveRequestDto {
  leaveTypeId!: string;
  startDate!: string;
  endDate!: string;
  reason?: string;
}

class LeaveDecisionDto {
  decision!: 'APPROVED' | 'REJECTED';
  note?: string;
}

@Controller('leave/requests')
@UseGuards(TenantGuard, PermissionGuard)
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Post()
  @RequirePermission('leave', 'request')
  create(@Req() req: TenantRequest, @CurrentUser() user: AuthenticatedUser, @Body() body: CreateLeaveRequestDto) {
    return this.service.createRequestForUser(req.tenant!.id, user.id, body.leaveTypeId, body.startDate, body.endDate, body.reason);
  }

  @Get()
  @RequirePermission('leave', 'read')
  list(@Req() req: TenantRequest, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listForUser(req.tenant!.id, user.id);
  }

  @Get(':requestId')
  @RequirePermission('leave', 'read')
  get(@Req() req: TenantRequest, @CurrentUser() user: AuthenticatedUser, @Param('requestId') requestId: string) {
    return this.service.getForUser(req.tenant!.id, user.id, requestId);
  }

  @Patch(':requestId/cancel')
  @RequirePermission('leave', 'request')
  cancel(@Req() req: TenantRequest, @CurrentUser() user: AuthenticatedUser, @Param('requestId') requestId: string) {
    return this.service.cancelRequestForUser(req.tenant!.id, user.id, requestId);
  }

  @Post(':requestId/decision')
  @RequirePermission('leave', 'approve')
  decide(@Req() req: TenantRequest, @CurrentUser() user: AuthenticatedUser, @Param('requestId') requestId: string, @Body() body: LeaveDecisionDto) {
    if (body.decision !== 'APPROVED' && body.decision !== 'REJECTED') throw new Error('Invalid leave decision');
    return this.service.decide(req.tenant!.id, requestId, user.id, body.decision, body.note);
  }
}
