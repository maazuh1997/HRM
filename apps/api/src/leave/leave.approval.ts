import { BadRequestException } from '@nestjs/common';
import type { LeaveRequestStatus } from '@prisma/client';

export function assertLeaveDecision(status: LeaveRequestStatus, next: 'APPROVED' | 'REJECTED'): void {
  if (status !== 'PENDING') throw new BadRequestException('Only pending leave requests can be decided');
  if (next !== 'APPROVED' && next !== 'REJECTED') throw new BadRequestException('Invalid leave decision');
}
