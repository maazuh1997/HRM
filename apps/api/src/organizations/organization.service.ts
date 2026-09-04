import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { RoleProvisioningService } from './role-provisioning.service';

@Injectable()
export class OrganizationService {
  constructor(private readonly roleProvisioningService: RoleProvisioningService) {}

  async createForUser(userId: string, name: string) {
    const normalizedName = name.trim();
    if (normalizedName.length < 2) throw new BadRequestException('Organization name is too short');

    const baseSlug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
    if (!baseSlug) throw new BadRequestException('Organization name cannot produce a valid slug');

    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const organization = await prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({ data: { name: normalizedName, slug } });
      const membership = await tx.membership.create({
        data: { organizationId: created.id, userId, status: 'ACTIVE' },
      });
      return { organization: created, membership };
    });

    const roles = await this.roleProvisioningService.provision(organization.organization.id, organization.membership.id);
    const ownerRole = roles.find((role) => role.name === 'Owner');

    return {
      organization: organization.organization,
      membership: organization.membership,
      role: ownerRole ?? null,
    };
  }

  async getMembership(userId: string, organizationId: string) {
    const membership = await prisma.membership.findFirst({
      where: { userId, organizationId, status: 'ACTIVE' },
      include: { organization: true, roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
    if (!membership) throw new NotFoundException('Active organization membership not found');
    return membership;
  }
}
