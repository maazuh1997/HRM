import type { SystemPermission } from './system-permissions';

export const SYSTEM_ROLES = {
  OWNER: {
    name: 'Owner',
    description: 'Full organization administration',
    permissions: 'ALL',
  },
  HR_ADMIN: {
    name: 'HR Admin',
    description: 'Full HR administration without ownership or billing control',
    permissions: 'HR_ADMIN',
  },
  HR_MANAGER: {
    name: 'HR Manager',
    description: 'Manage assigned HR operations and team workflows',
    permissions: 'HR_MANAGER',
  },
  RECRUITER: {
    name: 'Recruiter',
    description: 'Manage recruitment and candidate workflows',
    permissions: 'RECRUITER',
  },
  HR_SPECIALIST: {
    name: 'HR Specialist',
    description: 'Operate day-to-day HR processes',
    permissions: 'HR_SPECIALIST',
  },
  EMPLOYEE: {
    name: 'Employee',
    description: 'Employee self-service access',
    permissions: 'EMPLOYEE',
  },
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES;
export type SystemRolePermission = SystemPermission | '*:*';
