export type ApprovalDecision = 'APPROVE' | 'REJECT';

export type ApprovalStep = {
  id: string;
  sequence: number;
  approverUserId: string;
  required: boolean;
};

export type ApprovalContext = {
  organizationId: string;
  subjectType: string;
  subjectId: string;
  requesterUserId: string;
  steps: ApprovalStep[];
};
