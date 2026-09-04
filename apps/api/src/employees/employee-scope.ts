export type EmployeeScope = {
  organizationId: string;
  employeeId?: string;
  userId?: string;
};

export function belongsToOrganization(employeeOrganizationId: string, organizationId: string): boolean {
  return employeeOrganizationId === organizationId;
}
