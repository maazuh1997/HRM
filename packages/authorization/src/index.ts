export const actions = ['create', 'read', 'update', 'delete', 'manage'] as const;

export type AuthorizationAction = (typeof actions)[number];

export type Permission = {
  resource: string;
  action: AuthorizationAction;
};

export type AuthorizationContext = {
  userId: string;
  organizationId: string;
  membershipId: string;
  permissions: readonly Permission[];
};

export function hasPermission(
  context: AuthorizationContext,
  required: Permission,
): boolean {
  return context.permissions.some(
    (granted) =>
      (granted.resource === required.resource || granted.resource === '*') &&
      (granted.action === required.action || granted.action === 'manage'),
  );
}
