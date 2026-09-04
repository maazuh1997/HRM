import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { OrganizationService } from './organization.service';
import { ORGANIZATION_HEADER, TenantRequest } from './organization-context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly authGuard: AuthGuard,
    private readonly organizationService: OrganizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.authGuard.canActivate(context);
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const organizationId = request.headers[ORGANIZATION_HEADER] as string | undefined;
    if (!organizationId || !request.auth) {
      throw new UnauthorizedException('Organization context is required');
    }

    const membership = await this.organizationService.getMembership(request.auth.user.id, organizationId);
    request.tenant = {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      membershipId: membership.id,
      roleIds: membership.roles.map(({ role }) => role.id),
    };
    return true;
  }
}
