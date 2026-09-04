export const EMPLOYEE_EVENTS = {
  CREATED: 'employee.created',
  UPDATED: 'employee.updated',
  STATUS_CHANGED: 'employee.status_changed',
  TERMINATED: 'employee.terminated',
} as const;

export type EmployeeEvent = (typeof EMPLOYEE_EVENTS)[keyof typeof EMPLOYEE_EVENTS];
