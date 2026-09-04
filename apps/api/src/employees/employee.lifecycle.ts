export const EMPLOYEE_LIFECYCLE_STATUSES = ['DRAFT', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'] as const;

export type EmployeeLifecycleStatus = (typeof EMPLOYEE_LIFECYCLE_STATUSES)[number];

const TRANSITIONS: Record<EmployeeLifecycleStatus, readonly EmployeeLifecycleStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['ON_LEAVE', 'SUSPENDED', 'TERMINATED'],
  ON_LEAVE: ['ACTIVE', 'SUSPENDED', 'TERMINATED'],
  SUSPENDED: ['ACTIVE', 'TERMINATED'],
  TERMINATED: [],
};

export function canTransitionEmployeeStatus(
  from: EmployeeLifecycleStatus,
  to: EmployeeLifecycleStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}
