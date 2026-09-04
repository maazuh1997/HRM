import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Reflector } from '@nestjs/common';
import { hasPermission, type Permission } from '@hrm/auth';
import { REQUIRED_PERMISSION, type RequiredPermission } from './permission.decorator';
import type { TenantRequest } from '../organizations/organization-context';
import { prisma } from '@hrm/database';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(REQUIRED_PERMISSION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (!request.tenant) throw new ForbiddenException('Organization context is required');

    const roles = await prisma.role.findMany({
      where: { id: { in: request.tenant.roleIds }, organizationId: request.tenant.id },
      include: { permissions: { include: { permission: true } } },
    });

    const permissions: Permission[] = roles.flatMap((role) =>
      role.permissions.map(({ permission }) => ({ resource: permission.resource, action: permission.action })),
    );

    if (!hasPermission(permissions, required)) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}
