import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { Prisma } from '@prisma/client';
import { ApprovalService, ApprovalTransaction } from '../workflows/approval.service';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../events/outbox.service';
import { DomainEventType } from '../events/domain-event';

@Injectable()
export class LeaveService {
  constructor(private readonly approvalService: ApprovalService, private readonly auditService: AuditService, private readonly outboxService: OutboxService) {}

  private normalizeDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  private workingDays(startDate: Date, endDate: Date): number {
    if (endDate < startDate) throw new BadRequestException('End date must be on or after start date');
    let total = 0;
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const day = cursor.getUTCDay();
      if (day !== 0 && day !== 6) total += 1;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return total;
  }

  private async employeeForUser(organizationId: string, userId: string) {
    const employee = await prisma.employee.findFirst({ where: { organizationId, userId, status: { not: 'TERMINATED' } } });
    if (!employee) throw new NotFoundException('Employee profile not found');
    return employee;
  }

  async createRequestForUser(organizationId: string, userId: string, leaveTypeId: string, start: string, end: string, reason?: string) {
    const employee = await this.employeeForUser(organizationId, userId);
    return this.createRequest(organizationId, employee.id, leaveTypeId, start, end, reason, userId);
  }

  async createRequest(organizationId: string, employeeId: string, leaveTypeId: string, start: string, end: string, reason?: string, createdByUserId?: string) {
    const startDate = this.normalizeDate(start);
    const endDate = this.normalizeDate(end);
    const days = this.workingDays(startDate, endDate);
    if (days <= 0) throw new BadRequestException('Leave request must contain at least one working day');
    return prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({ where: { id: employeeId, organizationId, status: { not: 'TERMINATED' } } });
      if (!employee) throw new NotFoundException('Employee not found');
      const leaveType = await tx.leaveType.findFirst({ where: { id: leaveTypeId, organizationId, isActive: true } });
      if (!leaveType) throw new NotFoundException('Leave type not found');
      const overlap = await tx.leaveRequest.findFirst({ where: { organizationId, employeeId, status: { in: ['PENDING', 'APPROVED'] }, startDate: { lte: endDate }, endDate: { gte: startDate } } });
      if (overlap) throw new BadRequestException('An active leave request already overlaps these dates');
      const year = startDate.getUTCFullYear();
      const balance = await tx.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } } });
      if (!balance) throw new BadRequestException('Leave balance has not been initialized for this year');
      const available = Number(balance.allocated) + Number(balance.carried) - Number(balance.used) - Number(balance.pending);
      if (available < days) throw new BadRequestException('Insufficient leave balance');
      const request = await tx.leaveRequest.create({ data: { organizationId, employeeId, leaveTypeId, startDate, endDate, workingDays: new Prisma.Decimal(days), reason: reason?.trim() || undefined } });
      await tx.leaveBalance.update({ where: { id: balance.id }, data: { pending: { increment: new Prisma.Decimal(days) } } });
      await this.auditService.recordInTransaction(tx, { organizationId, actorUserId: createdByUserId, action: 'LEAVE_REQUEST_CREATED', resourceType: 'LEAVE_REQUEST', resourceId: request.id, metadata: { employeeId, leaveTypeId, startDate: startDate.toISOString(), endDate: endDate.toISOString(), workingDays: days } });
      await this.outboxService.enqueueInTransaction(tx, { type: DomainEventType.LeaveRequestCreated, organizationId, actorUserId: createdByUserId, resourceType: 'LEAVE_REQUEST', resourceId: request.id, occurredAt: new Date(), payload: { employeeId, leaveTypeId, startDate: startDate.toISOString(), endDate: endDate.toISOString(), workingDays: days } });
      if (leaveType.requiresApproval) {
        const manager = employee.managerId ? await tx.employee.findFirst({ where: { id: employee.managerId, organizationId }, select: { userId: true } }) : null;
        if (!manager?.userId) throw new BadRequestException('No manager is configured for leave approval');
        if (!createdByUserId) throw new BadRequestException('Workflow creator is required');
        await this.approvalService.createWorkflowInTransaction(tx, organizationId, 'LEAVE_REQUEST', request.id, createdByUserId, [manager.userId]);
        await this.auditService.recordInTransaction(tx, { organizationId, actorUserId: createdByUserId, action: 'LEAVE_APPROVAL_STARTED', resourceType: 'LEAVE_REQUEST', resourceId: request.id, metadata: { approverUserId: manager.userId } });
        await this.outboxService.enqueueInTransaction(tx, { type: DomainEventType.LeaveApprovalRequired, organizationId, actorUserId: createdByUserId, resourceType: 'LEAVE_REQUEST', resourceId: request.id, occurredAt: new Date(), payload: { employeeId, approverUserId: manager.userId, leaveTypeId, startDate: startDate.toISOString(), endDate: endDate.toISOString(), workingDays: days } });
      } else {
        await tx.leaveBalance.update({ where: { id: balance.id }, data: { pending: { decrement: request.workingDays }, used: { increment: request.workingDays } } });
        await this.auditService.recordInTransaction(tx, { organizationId, actorUserId: createdByUserId, action: 'LEAVE_BALANCE_CONSUMED', resourceType: 'LEAVE_REQUEST', resourceId: request.id, metadata: { workingDays: days } });
        await this.auditService.recordInTransaction(tx, { organizationId, actorUserId: createdByUserId, action: 'LEAVE_APPROVED', resourceType: 'LEAVE_REQUEST', resourceId: request.id });
        const approved = await tx.leaveRequest.update({ where: { id: request.id }, data: { status: 'APPROVED', decidedAt: new Date() } });
        await this.outboxService.enqueueInTransaction(tx, { type: DomainEventType.LeaveApproved, organizationId, actorUserId: createdByUserId, resourceType: 'LEAVE_REQUEST', resourceId: request.id, occurredAt: new Date(), payload: { employeeId, leaveTypeId, workingDays: days } });
        return approved;
      }
      return request;
    });
  }

  async listForUser(organizationId: string, userId: string) {
    const employee = await this.employeeForUser(organizationId, userId);
    return prisma.leaveRequest.findMany({ where: { organizationId, employeeId: employee.id }, include: { leaveType: true }, orderBy: { createdAt: 'desc' } });
  }

  async getForUser(organizationId: string, userId: string, requestId: string) {
    const employee = await this.employeeForUser(organizationId, userId);
    const request = await prisma.leaveRequest.findFirst({ where: { id: requestId, organizationId, employeeId: employee.id }, include: { leaveType: true } });
    if (!request) throw new NotFoundException('Leave request not found');
    return request;
  }

  async getBalancesForUser(organizationId: string, userId: string) {
    const employee = await this.employeeForUser(organizationId, userId);
    return prisma.leaveBalance.findMany({ where: { organizationId, employeeId: employee.id }, include: { leaveType: true }, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }] });
  }

  async cancelRequestForUser(organizationId: string, userId: string, requestId: string) {
    const employee = await this.employeeForUser(organizationId, userId);
    return this.cancelRequest(organizationId, employee.id, requestId, userId);
  }

  async cancelRequest(organizationId: string, employeeId: string, requestId: string, actorUserId?: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findFirst({ where: { id: requestId, organizationId, employeeId } });
      if (!request) throw new NotFoundException('Leave request not found');
      if (request.status !== 'PENDING') throw new BadRequestException('Only pending leave requests can be cancelled');
      const workflow = await tx.approvalWorkflow.findFirst({ where: { organizationId, resourceType: 'LEAVE_REQUEST', resourceId: request.id, status: 'PENDING' } });
      if (workflow) await tx.approvalWorkflow.update({ where: { id: workflow.id }, data: { status: 'CANCELLED', completedAt: new Date() } });
      const updated = await tx.leaveRequest.update({ where: { id: request.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
      const year = request.startDate.getUTCFullYear();
      await tx.leaveBalance.updateMany({ where: { organizationId, employeeId, leaveTypeId: request.leaveTypeId, year }, data: { pending: { decrement: request.workingDays } } });
      await this.auditService.recordInTransaction(tx, { organizationId, actorUserId, action: 'LEAVE_BALANCE_RELEASED', resourceType: 'LEAVE_REQUEST', resourceId: request.id, metadata: { workingDays: Number(request.workingDays) } });
      await this.auditService.recordInTransaction(tx, { organizationId, actorUserId, action: 'LEAVE_CANCELLED', resourceType: 'LEAVE_REQUEST', resourceId: request.id });
      await this.outboxService.enqueueInTransaction(tx, { type: DomainEventType.LeaveCancelled, organizationId, actorUserId, resourceType: 'LEAVE_REQUEST', resourceId: request.id, occurredAt: new Date(), payload: { employeeId, leaveTypeId: request.leaveTypeId, workingDays: Number(request.workingDays) } });
      return updated;
    });
  }

  async decide(organizationId: string, requestId: string, approverUserId: string, decision: 'APPROVED' | 'REJECTED', note?: string) {
    return this.approvalService.decideForResource(organizationId, 'LEAVE_REQUEST', requestId, approverUserId, decision, note, (tx, workflow) => this.finalizeDecision(tx, workflow.resourceId, approverUserId, decision, note));
  }

  private async finalizeDecision(tx: ApprovalTransaction, requestId: string, actorUserId: string, decision: 'APPROVED' | 'REJECTED', note?: string) {
    const request = await tx.leaveRequest.findFirst({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.status !== 'PENDING') throw new BadRequestException('Leave request is already finalized');
    const year = request.startDate.getUTCFullYear();
    const balance = await tx.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year } } });
    if (!balance || Number(balance.pending) < Number(request.workingDays)) throw new BadRequestException('Leave balance reservation is invalid');
    if (decision === 'APPROVED') {
      await tx.leaveBalance.update({ where: { id: balance.id }, data: { pending: { decrement: request.workingDays }, used: { increment: request.workingDays } } });
      await this.auditService.recordInTransaction(tx, { organizationId: request.organizationId, actorUserId, action: 'LEAVE_BALANCE_CONSUMED', resourceType: 'LEAVE_REQUEST', resourceId: request.id, metadata: { workingDays: Number(request.workingDays) } });
      await this.auditService.recordInTransaction(tx, { organizationId: request.organizationId, actorUserId, action: 'LEAVE_APPROVED', resourceType: 'LEAVE_REQUEST', resourceId: request.id, metadata: { note: note?.trim() || null } });
    } else {
      await tx.leaveBalance.update({ where: { id: balance.id }, data: { pending: { decrement: request.workingDays } } });
      await this.auditService.recordInTransaction(tx, { organizationId: request.organizationId, actorUserId, action: 'LEAVE_BALANCE_RELEASED', resourceType: 'LEAVE_REQUEST', resourceId: request.id, metadata: { workingDays: Number(request.workingDays) } });
      await this.auditService.recordInTransaction(tx, { organizationId: request.organizationId, actorUserId, action: 'LEAVE_REJECTED', resourceType: 'LEAVE_REQUEST', resourceId: request.id, metadata: { note: note?.trim() || null } });
    }
    const updated = await tx.leaveRequest.update({ where: { id: request.id }, data: { status: decision, approverUserId: actorUserId, decidedAt: new Date(), decisionNote: note?.trim() || undefined } });
    await this.outboxService.enqueueInTransaction(tx, { type: decision === 'APPROVED' ? DomainEventType.LeaveApproved : DomainEventType.LeaveRejected, organizationId: request.organizationId, actorUserId, resourceType: 'LEAVE_REQUEST', resourceId: request.id, occurredAt: new Date(), payload: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, workingDays: Number(request.workingDays), note: note?.trim() || null } });
    return updated;
  }
}
