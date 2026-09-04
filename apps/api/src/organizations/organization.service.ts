import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';

@Injectable()
export class OrganizationService {
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

    return prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: normalizedName, slug } });
      const membership = await tx.membership.create({
        data: { organizationId: organization.id, userId, status: 'ACTIVE' },
      });
      const ownerRole = await tx.role.create({
        data: {
          organizationId: organization.id,
          name: 'Owner',
          description: 'Full administrative access to the organization',
          isSystem: true,
        },
      });
      await tx.membershipRole.create({ data: { membershipId: membership.id, roleId: ownerRole.id } });
      return { organization, membership, role: ownerRole };
    });
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
