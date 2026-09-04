import type { Request } from 'express';
import type { SessionContext } from '@hrm/auth';

export const ORGANIZATION_HEADER = 'x-organization-id';

export type OrganizationContext = {
  id: string;
  name: string;
  slug: string;
  membershipId: string;
  roleIds: string[];
};

export type TenantRequest = Request & {
  auth?: SessionContext;
  tenant?: OrganizationContext;
};
