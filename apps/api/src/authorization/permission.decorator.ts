import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION = 'hrm:required_permission';

export type RequiredPermission = {
  resource: string;
  action: string;
};

export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(REQUIRED_PERMISSION, { resource, action } satisfies RequiredPermission);
