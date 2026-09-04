import { Injectable } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { DomainEventBus } from '../events/domain-event.bus';
import { DomainEventType, type DomainEvent } from '../events/domain-event';
import { NotificationFactory } from './notification.factory';

@Injectable()
export class LeaveNotificationHandler {
  constructor(private readonly eventBus: DomainEventBus, private readonly notificationFactory: NotificationFactory) {
    this.eventBus.subscribe(DomainEventType.LeaveApprovalRequired, (event) => this.handleApprovalRequired(event));
    this.eventBus.subscribe(DomainEventType.LeaveApproved, (event) => this.handleEmployeeDecision(event, 'approved'));
    this.eventBus.subscribe(DomainEventType.LeaveRejected, (event) => this.handleEmployeeDecision(event, 'rejected'));
    this.eventBus.subscribe(DomainEventType.LeaveCancelled, (event) => this.handleCancellation(event));
  }

  private async handleApprovalRequired(event: DomainEvent) {
    const approverUserId = this.stringValue(event.payload.approverUserId);
    if (!approverUserId) return;
    const context = await this.leaveContext(event);
    if (!context) return;
    await prisma.$transaction((tx) => this.notificationFactory.createFromEvent(tx, event, {
      type: 'LEAVE_APPROVAL_REQUIRED',
      title: 'Leave approval required',
      body: `${context.employeeName} submitted ${context.leaveTypeName} leave for ${context.dateRange}.`,
      recipientUserIds: [approverUserId],
      channels: ['IN_APP', 'EMAIL'],
    }));
  }

  private async handleEmployeeDecision(event: DomainEvent, decision: 'approved' | 'rejected') {
    const context = await this.leaveContext(event);
    if (!context?.employeeUserId) return;
    await prisma.$transaction((tx) => this.notificationFactory.createFromEvent(tx, event, {
      type: decision === 'approved' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      title: decision === 'approved' ? 'Leave approved' : 'Leave rejected',
      body: `${context.leaveTypeName} leave for ${context.dateRange} was ${decision}.${this.noteSuffix(event)}`,
      recipientUserIds: [context.employeeUserId],
      channels: ['IN_APP', 'EMAIL'],
    }));
  }

  private async handleCancellation(event: DomainEvent) {
    const context = await this.leaveContext(event);
    if (!context?.managerUserId) return;
    await prisma.$transaction((tx) => this.notificationFactory.createFromEvent(tx, event, {
      type: 'LEAVE_CANCELLED',
      title: 'Leave request cancelled',
      body: `${context.employeeName} cancelled ${context.leaveTypeName} leave for ${context.dateRange}.`,
      recipientUserIds: [context.managerUserId],
      channels: ['IN_APP', 'EMAIL'],
    }));
  }

  private async leaveContext(event: DomainEvent) {
    const employeeId = this.stringValue(event.payload.employeeId);
    if (!employeeId) return null;
    const request = await prisma.leaveRequest.findFirst({
      where: { id: event.resourceId, organizationId: event.organizationId, employeeId },
      select: {
        startDate: true,
        endDate: true,
        leaveType: { select: { name: true } },
        employee: { select: { firstName: true, lastName: true, userId: true, manager: { select: { userId: true } } } },
      },
    });
    if (!request) return null;
    return {
      employeeName: `${request.employee.firstName} ${request.employee.lastName}`.trim(),
      employeeUserId: request.employee.userId,
      managerUserId: request.employee.manager?.userId,
      leaveTypeName: request.leaveType.name,
      dateRange: this.formatDateRange(request.startDate, request.endDate),
    };
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' && value ? value : undefined;
  }

  private formatDateRange(start: Date, end: Date) {
    return start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10) ? start.toISOString().slice(0, 10) : `${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`;
  }

  private noteSuffix(event: DomainEvent) {
    const note = this.stringValue(event.payload.note);
    return note ? ` Note: ${note}` : '';
  }
}
