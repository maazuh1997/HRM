import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';

@Injectable()
export class ApprovalService {
  async createWorkflow(organizationId: string, resourceType: string, resourceId: string, createdByUserId: string, approverUserIds: string[]) {
    return prisma.$transaction((tx) => this.createWorkflowInTransaction(tx, organizationId, resourceType, resourceId, createdByUserId, approverUserIds));
  }

  async createWorkflowInTransaction(tx: any, organizationId: string, resourceType: string, resourceId: string, createdByUserId: string, approverUserIds: string[]) {
    if (!approverUserIds.length) throw new BadRequestException('At least one approver is required');
    const existing = await tx.approvalWorkflow.findUnique({ where: { resourceType_resourceId: { resourceType, resourceId } } });
    if (existing) return existing;
    const workflow = await tx.approvalWorkflow.create({ data: { organizationId, resourceType, resourceId, createdByUserId } });
    await tx.approvalStep.createMany({ data: approverUserIds.map((approverUserId, index) => ({ workflowId: workflow.id, sequence: index + 1, approverUserId })) });
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
      const remaining = workflow.steps.some((step) => step.id !== current.id && step.status === 'PENDING');
      return tx.approvalWorkflow.update({ where: { id: workflow.id }, data: remaining ? {} : { status: 'APPROVED', completedAt: new Date() } });
    });
  }
}
