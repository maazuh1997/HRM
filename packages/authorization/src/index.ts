export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface Permission {
  resource: string;
  action: PermissionAction;
}

export interface AuthorizationContext {
  userId: string;
  organizationId: string;
  permissions: readonly Permission[];
}

export function hasPermission(
  context: AuthorizationContext,
  resource: string,
  action: PermissionAction,
): boolean {
  return context.permissions.some(
    (permission) =>
      permission.resource === resource &&
      (permission.action === action || permission.action === 'manage'),
  );
}
