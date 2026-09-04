import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { Prisma } from '@prisma/client';

export type ApprovalTransaction = Prisma.TransactionClient;

@Injectable()
export class ApprovalService {
  async createWorkflow(organizationId: string, resourceType: string, resourceId: string, createdByUserId: string, approverUserIds: string[]) {
    return prisma.$transaction((tx) => this.createWorkflowInTransaction(tx, organizationId, resourceType, resourceId, createdByUserId, approverUserIds));
  }

  async createWorkflowInTransaction(tx: ApprovalTransaction, organizationId: string, resourceType: string, resourceId: string, createdByUserId: string, approverUserIds: string[]) {
    const uniqueApprovers = [...new Set(approverUserIds)];
    if (!uniqueApprovers.length) throw new BadRequestException('At least one approver is required');
    const users = await tx.user.findMany({ where: { id: { in: uniqueApprovers }, memberships: { some: { organizationId, status: 'ACTIVE' } } }, select: { id: true } });
    if (users.length !== uniqueApprovers.length) throw new BadRequestException('One or more approvers are not members of this organization');
    const existing = await tx.approvalWorkflow.findUnique({ where: { resourceType_resourceId: { resourceType, resourceId } } });
    if (existing) return existing;
    const workflow = await tx.approvalWorkflow.create({ data: { organizationId, resourceType, resourceId, createdByUserId } });
    await tx.approvalStep.createMany({ data: uniqueApprovers.map((approverUserId, index) => ({ workflowId: workflow.id, sequence: index + 1, approverUserId })) });
    return workflow;
  }

  async decide(organizationId: string, workflowId: string, actorUserId: string, decision: 'APPROVED' | 'REJECTED', note?: string) {
    return prisma.$transaction(async (tx) => {
      const workflow = await tx.approvalWorkflow.findFirst({ where: { id: workflowId, organizationId }, include: { steps: { orderBy: { sequence: 'asc' } } } });
      if (!workflow) throw new NotFoundException('Approval workflow not found');
      if (workflow.status !== 'PENDING') throw new BadRequestException('Workflow is already complete');
      const current = workflow.steps.find((step) => step.status === 'PENDING');
      if (!current || current.approverUserId !== actorUserId) throw new BadRequestException('You are not the current approver');
      await tx.approvalStep.update({ where: { id: current.id }, data: { status: decision, decidedAt: new Date(), decisionNote: note?.trim() || undefined } });
      if (decision === 'REJECTED') return tx.approvalWorkflow.update({ where: { id: workflow.id }, data: { status: 'REJECTED', completedAt: new Date() } });
      const next = workflow.steps.find((step) => step.sequence === current.sequence + 1);
      if (next) {
        await tx.approvalStep.update({ where: { id: next.id }, data: { status: 'PENDING' } });
        return workflow;
      }
      return tx.approvalWorkflow.update({ where: { id: workflow.id }, data: { status: 'APPROVED', completedAt: new Date() } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async listPendingForApprover(organizationId: string, approverUserId: string) {
    return prisma.approvalStep.findMany({ where: { approverUserId, status: 'PENDING', workflow: { organizationId, status: 'PENDING' } }, include: { workflow: true }, orderBy: { createdAt: 'asc' } });
  }
}
