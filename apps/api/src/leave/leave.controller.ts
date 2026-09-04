import { Body, Controller, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { LeaveService } from './leave.service';

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

@Controller('api/v1/leave/requests')
@UseGuards(AuthGuard)
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-id') organizationId: string,
    @Body() body: CreateLeaveRequestDto,
  ) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.createRequestForUser(organizationId, user.id, body.leaveTypeId, body.startDate, body.endDate, body.reason);
  }

  @Patch(':requestId/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-id') organizationId: string,
    @Param('requestId') requestId: string,
  ) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.cancelRequestForUser(organizationId, user.id, requestId);
  }

  @Post(':requestId/decision')
  decide(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-id') organizationId: string,
    @Param('requestId') requestId: string,
    @Body() body: LeaveDecisionDto,
  ) {
    if (!organizationId) throw new Error('Organization context is required');
    if (body.decision !== 'APPROVED' && body.decision !== 'REJECTED') throw new Error('Invalid leave decision');
    return this.service.decide(organizationId, requestId, user.id, body.decision, body.note);
  }
}
