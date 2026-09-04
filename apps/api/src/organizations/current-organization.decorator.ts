import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { TenantRequest } from './organization-context';

export const CurrentOrganization = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<TenantRequest>();
  return request.tenant;
});
