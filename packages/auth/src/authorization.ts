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
