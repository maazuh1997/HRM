import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaveApprovalService {
  async decide(organizationId: string, requestId: string, approverUserId: string, decision: 'APPROVED' | 'REJECTED', note?: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findFirst({
        where: { id: requestId, organizationId },
        include: { employee: true },
      });
      if (!request) throw new NotFoundException('Leave request not found');
      if (request.status !== 'PENDING') throw new BadRequestException('Only pending leave requests can be decided');

      const workflow = await tx.approvalWorkflow.findFirst({
        where: { organizationId, resourceType: 'LEAVE_REQUEST', resourceId: request.id, status: 'PENDING' },
        include: { steps: { orderBy: { sequence: 'asc' } } },
      });
      if (!workflow) throw new BadRequestException('Leave approval workflow not found');

      const currentStep = workflow.steps.find((step) => step.status === 'PENDING');
      if (!currentStep || currentStep.approverUserId !== approverUserId) throw new BadRequestException('You are not the current approver');

      await tx.approvalStep.update({
        where: { id: currentStep.id },
        data: { status: decision, decidedAt: new Date(), decisionNote: note?.trim() || undefined },
      });

      const year = request.startDate.getUTCFullYear();
      const balance = await tx.leaveBalance.findUnique({
        where: { employeeId_leaveTypeId_year: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year } },
      });
      if (!balance || Number(balance.pending) < Number(request.workingDays)) throw new BadRequestException('Leave balance reservation is invalid');

      if (decision === 'REJECTED') {
        await tx.leaveBalance.update({ where: { id: balance.id }, data: { pending: { decrement: request.workingDays } } });
        await tx.approvalWorkflow.update({ where: { id: workflow.id }, data: { status: 'REJECTED', completedAt: new Date() } });
        return tx.leaveRequest.update({ where: { id: request.id }, data: { status: 'REJECTED', approverUserId, decidedAt: new Date(), decisionNote: note?.trim() || undefined } });
      }

      const remaining = workflow.steps.some((step) => step.id !== currentStep.id && step.status === 'PENDING');
      if (remaining) return request;

      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { decrement: request.workingDays }, used: { increment: request.workingDays } },
      });
      await tx.approvalWorkflow.update({ where: { id: workflow.id }, data: { status: 'APPROVED', completedAt: new Date() } });
      return tx.leaveRequest.update({ where: { id: request.id }, data: { status: 'APPROVED', approverUserId, decidedAt: new Date(), decisionNote: note?.trim() || undefined } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
