import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { LicenseService } from './license.service';
import type { TenantRequest } from '../organizations/organization-context';

@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(private readonly licenseService: LicenseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (!request.tenant) throw new ForbiddenException('Organization context is required');

    const license = await this.licenseService.getActive(request.tenant.id);
    if (!license) throw new ForbiddenException('A valid HRM license is required');

    return true;
  }
}
