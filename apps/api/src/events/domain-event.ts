export const DomainEventType = {
  LeaveRequestCreated: 'LEAVE_REQUEST_CREATED',
  LeaveApprovalRequired: 'LEAVE_APPROVAL_REQUIRED',
  LeaveApproved: 'LEAVE_APPROVED',
  LeaveRejected: 'LEAVE_REJECTED',
  LeaveCancelled: 'LEAVE_CANCELLED',
} as const;

export type DomainEventType = (typeof DomainEventType)[keyof typeof DomainEventType];

export type DomainEvent = {
  type: DomainEventType;
  organizationId: string;
  actorUserId?: string;
  resourceType: string;
  resourceId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
};
