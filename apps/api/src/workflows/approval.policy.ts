import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { ApprovalContext, ApprovalDecision } from './approval.types';

export function getCurrentApprovalStep(context: ApprovalContext, completedStepIds: string[]) {
  return context.steps
    .filter((step) => !completedStepIds.includes(step.id))
    .sort((a, b) => a.sequence - b.sequence)[0];
}

export function assertApprovalDecision(context: ApprovalContext, completedStepIds: string[], actorUserId: string, decision: ApprovalDecision) {
  const step = getCurrentApprovalStep(context, completedStepIds);
  if (!step) throw new BadRequestException('Approval workflow is already complete');
  if (step.approverUserId !== actorUserId) throw new ForbiddenException('You are not the current approver');
  if (decision !== 'APPROVE' && decision !== 'REJECT') throw new BadRequestException('Invalid approval decision');
  return step;
}
