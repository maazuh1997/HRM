import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

export type ApprovalTransaction = Prisma.TransactionClient;
export type ApprovalDecision = 'APPROVED' | 'REJECTED';

@Injectable()
export class ApprovalService {
  constructor(private readonly auditService: AuditService) {}

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
    await this.auditService.recordInTransaction(tx, { organizationId, actorUserId: createdByUserId, action: 'APPROVAL_WORKFLOW_CREATED', resourceType, resourceId, metadata: { approverUserIds: uniqueApprovers } });
    return workflow;
  }

  async decideForResource(organizationId: string, resourceType: string, resourceId: string, actorUserId: string, decision: ApprovalDecision, note?: string, finalize?: (tx: ApprovalTransaction, workflow: any) => Promise<unknown>) {
    return prisma.$transaction(async (tx) => {
      const workflow = await tx.approvalWorkflow.findFirst({ where: { organizationId, resourceType, resourceId, status: 'PENDING' }, include: { steps: { orderBy: { sequence: 'asc' } } } });
      if (!workflow) throw new NotFoundException('Approval workflow not found');
      return this.decideInTransaction(tx, workflow, actorUserId, decision, note, finalize);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async decide(organizationId: string, workflowId: string, actorUserId: string, decision: ApprovalDecision, note?: string, finalize?: (tx: ApprovalTransaction, workflow: any) => Promise<unknown>) {
    return prisma.$transaction(async (tx) => {
      const workflow = await tx.approvalWorkflow.findFirst({ where: { id: workflowId, organizationId }, include: { steps: { orderBy: { sequence: 'asc' } } } });
      if (!workflow) throw new NotFoundException('Approval workflow not found');
      return this.decideInTransaction(tx, workflow, actorUserId, decision, note, finalize);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async decideInTransaction(tx: ApprovalTransaction, workflow: any, actorUserId: string, decision: ApprovalDecision, note?: string, finalize?: (tx: ApprovalTransaction, workflow: any) => Promise<unknown>) {
    if (workflow.status !== 'PENDING') throw new BadRequestException('Workflow is already complete');
    const current = workflow.steps.find((step: any) => step.status === 'PENDING');
    if (!current || current.approverUserId !== actorUserId) throw new BadRequestException('You are not the current approver');
    await tx.approvalStep.update({ where: { id: current.id }, data: { status: decision, decidedAt: new Date(), decisionNote: note?.trim() || undefined } });
    await this.auditService.recordInTransaction(tx, { organizationId: workflow.organizationId, actorUserId, action: decision === 'APPROVED' ? 'APPROVAL_STEP_APPROVED' : 'APPROVAL_STEP_REJECTED', resourceType: workflow.resourceType, resourceId: workflow.resourceId, metadata: { workflowId: workflow.id, stepId: current.id, sequence: current.sequence, note: note?.trim() || null } });
    if (decision === 'REJECTED') {
      const completed = await tx.approvalWorkflow.update({ where: { id: workflow.id }, data: { status: 'REJECTED', completedAt: new Date() } });
      if (finalize) await finalize(tx, completed);
      return completed;
    }
    const next = workflow.steps.find((step: any) => step.sequence === current.sequence + 1);
    if (next) {
      await tx.approvalStep.update({ where: { id: next.id }, data: { status: 'PENDING' } });
      return workflow;
    }
    const completed = await tx.approvalWorkflow.update({ where: { id: workflow.id }, data: { status: 'APPROVED', completedAt: new Date() } });
    await this.auditService.recordInTransaction(tx, { organizationId: workflow.organizationId, actorUserId, action: 'APPROVAL_WORKFLOW_APPROVED', resourceType: workflow.resourceType, resourceId: workflow.resourceId, metadata: { workflowId: workflow.id } });
    if (finalize) await finalize(tx, completed);
    return completed;
  }

  async listPendingForApprover(organizationId: string, approverUserId: string) {
    return prisma.approvalStep.findMany({ where: { approverUserId, status: 'PENDING', workflow: { organizationId, status: 'PENDING' } }, include: { workflow: true }, orderBy: { createdAt: 'asc' } });
  }
}
