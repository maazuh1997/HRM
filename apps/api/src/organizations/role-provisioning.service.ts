import { Injectable } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { SYSTEM_PERMISSIONS } from '@hrm/auth';

const ROLE_DEFINITIONS = [
  { name: 'Owner', description: 'Full organization administration', all: true },
  { name: 'HR Admin', description: 'Full HR administration without ownership or billing control', resources: ['organizations:read', 'organizations:update', 'memberships:read', 'memberships:invite', 'memberships:update', 'memberships:remove', 'roles:read', 'roles:create', 'roles:update', 'roles:delete', 'permissions:read', 'employees:read', 'employees:create', 'employees:update', 'employees:delete', 'recruitment:read', 'recruitment:manage', 'leave:read', 'leave:request', 'leave:approve', 'attendance:read', 'attendance:manage', 'documents:read', 'documents:manage', 'tasks:read', 'tasks:manage', 'performance:read', 'performance:manage', 'training:read', 'training:manage', 'assets:read', 'assets:manage', 'reports:read', 'reports:export', 'audit:read'] },
  { name: 'HR Manager', description: 'Manage assigned HR operations and team workflows', resources: ['organizations:read', 'memberships:read', 'employees:read', 'employees:create', 'employees:update', 'recruitment:read', 'recruitment:manage', 'leave:read', 'leave:request', 'leave:approve', 'attendance:read', 'attendance:manage', 'documents:read', 'documents:manage', 'tasks:read', 'tasks:manage', 'performance:read', 'performance:manage', 'training:read', 'training:manage', 'assets:read', 'assets:manage', 'reports:read', 'reports:export'] },
  { name: 'Recruiter', description: 'Manage recruitment and candidate workflows', resources: ['organizations:read', 'memberships:read', 'employees:read', 'recruitment:read', 'recruitment:manage', 'tasks:read', 'tasks:manage', 'documents:read', 'documents:manage', 'reports:read'] },
  { name: 'HR Specialist', description: 'Operate day-to-day HR processes', resources: ['organizations:read', 'employees:read', 'employees:create', 'employees:update', 'leave:read', 'leave:request', 'attendance:read', 'attendance:manage', 'documents:read', 'documents:manage', 'tasks:read', 'tasks:manage', 'performance:read', 'training:read', 'assets:read', 'reports:read'] },
  { name: 'Employee', description: 'Employee self-service access', resources: ['organizations:read', 'employees:read', 'leave:read', 'leave:request', 'attendance:read', 'documents:read', 'tasks:read', 'performance:read', 'training:read', 'assets:read'] },
] as const;

@Injectable()
export class RoleProvisioningService {
  async provision(organizationId: string, ownerMembershipId: string) {
    return prisma.$transaction(async (tx) => {
      const permissionRecords = await Promise.all(
        SYSTEM_PERMISSIONS.map(([resource, action]) =>
          tx.permission.upsert({
            where: { resource_action: { resource, action } },
            create: { resource, action },
            update: {},
          }),
        ),
      );

      const permissions = new Map(permissionRecords.map((permission) => [`${permission.resource}:${permission.action}`, permission]));
      const roles = [];

      for (const definition of ROLE_DEFINITIONS) {
        const role = await tx.role.upsert({
          where: { organizationId_name: { organizationId, name: definition.name } },
          create: { organizationId, name: definition.name, description: definition.description, isSystem: true },
          update: { description: definition.description, isSystem: true },
        });

        const keys = definition.all ? [...permissions.keys()] : definition.resources;
        for (const key of keys) {
          const permission = permissions.get(key);
          if (permission) {
            await tx.rolePermission.upsert({
              where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
              create: { roleId: role.id, permissionId: permission.id },
              update: {},
            });
          }
        }
        roles.push(role);
      }

      const ownerRole = roles.find((role) => role.name === 'Owner');
      if (ownerRole) {
        await tx.membershipRole.upsert({
          where: { membershipId_roleId: { membershipId: ownerMembershipId, roleId: ownerRole.id } },
          create: { membershipId: ownerMembershipId, roleId: ownerRole.id },
          update: {},
        });
      }

      return roles;
    });
  }
}
