export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type SessionContext = {
  user: AuthenticatedUser;
  sessionId: string;
};

export interface AuthSessionStore {
  create(userId: string): Promise<{ sessionId: string; expiresAt: Date }>;
  get(sessionId: string): Promise<SessionContext | null>;
  revoke(sessionId: string): Promise<void>;
}

export type Permission = {
  resource: string;
  action: string;
};

export function permissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

export function hasPermission(permissions: Permission[], required: Permission): boolean {
  const requiredKey = permissionKey(required.resource, required.action);
  return permissions.some((permission) => permissionKey(permission.resource, permission.action) === requiredKey);
}

export { SYSTEM_PERMISSIONS } from './system-permissions';
export type { SystemPermission } from './system-permissions';
export { SYSTEM_ROLES } from './system-roles';
export type { SystemRoleKey, SystemRolePermission } from './system-roles';
export { hashPassword, verifyPassword } from './password';
export { createSessionToken, hashSessionToken } from './session-token';
