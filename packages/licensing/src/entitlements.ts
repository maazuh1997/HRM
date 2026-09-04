export type EntitlementLimits = {
  maxHrUsers: number;
  maxEmployees: number;
};

export type EntitlementContext = {
  entitlements: Set<string>;
  limits: EntitlementLimits;
};

export function hasEntitlement(context: EntitlementContext, entitlement: string): boolean {
  return context.entitlements.has(entitlement);
}

export function canAddHrUser(currentCount: number, context: EntitlementContext): boolean {
  return currentCount < context.limits.maxHrUsers;
}

export function canAddEmployee(currentCount: number, context: EntitlementContext): boolean {
  return currentCount < context.limits.maxEmployees;
}
