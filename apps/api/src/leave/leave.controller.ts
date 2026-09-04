import { Body, Controller, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { LeaveService } from './leave.service';

class CreateLeaveRequestDto {
  employeeId!: string;
  leaveTypeId!: string;
  startDate!: string;
  endDate!: string;
  reason?: string;
}

@Controller('leave/requests')
@UseGuards(AuthGuard)
export class LeaveController {
  constructor(private readonly service: LeaveService) {}

  @Post()
  create(@Headers('x-organization-id') organizationId: string, @Body() body: CreateLeaveRequestDto) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.createRequest(organizationId, body.employeeId, body.leaveTypeId, body.startDate, body.endDate, body.reason);
  }

  @Patch(':requestId/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-id') organizationId: string,
    @Param('requestId') requestId: string,
  ) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.cancelRequest(organizationId, user.id, requestId);
  }
}
