export type EmployeeOrganizationAssignment = {
  organizationId: string;
  departmentId?: string;
  positionId?: string;
  managerEmployeeId?: string;
};

export function validateEmployeeManagerAssignment(employeeId: string, managerEmployeeId?: string): void {
  if (managerEmployeeId && employeeId === managerEmployeeId) {
    throw new Error('An employee cannot manage themselves');
  }
}
