export type EmployeeHistoryEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'DEPARTMENT_CHANGED'
  | 'MANAGER_CHANGED'
  | 'JOB_TITLE_CHANGED'
  | 'STATUS_CHANGED'
  | 'TERMINATED';

export type EmployeeHistoryEntry = {
  type: EmployeeHistoryEventType;
  occurredAt: Date;
  actorUserId: string;
  previousValue?: unknown;
  newValue?: unknown;
};
