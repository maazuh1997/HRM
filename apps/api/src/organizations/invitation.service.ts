import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@hrm/database';

const INVITATION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

@Injectable()
export class InvitationService {
  async create(organizationId: string, invitedById: string, email: string, roleId?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new BadRequestException('Invalid email address');

    const membership = await prisma.membership.findFirst({
      where: { organizationId, userId: invitedById, status: 'ACTIVE' },
    });
    if (!membership) throw new NotFoundException('Active organization membership not found');

    if (roleId) {
      const role = await prisma.role.findFirst({ where: { id: roleId, organizationId } });
      if (!role) throw new NotFoundException('Role not found in organization');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      const existingMembership = await prisma.membership.findUnique({
        where: { organizationId_userId: { organizationId, userId: existingUser.id } },
      });
      if (existingMembership && existingMembership.status !== 'REMOVED') {
        throw new BadRequestException('User is already a member of this organization');
      }
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    await prisma.invitation.updateMany({
      where: { organizationId, email: normalizedEmail, status: 'PENDING' },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    const invitation = await prisma.invitation.create({
      data: { organizationId, email: normalizedEmail, tokenHash, roleId, invitedById, expiresAt },
      include: { role: true, organization: true },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      organization: invitation.organization,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      token,
    };
  }

  async getByToken(token: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invitation = await prisma.invitation.findUnique({ where: { tokenHash }, include: { organization: true, role: true } });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== 'PENDING') throw new BadRequestException('Invitation is no longer active');
    if (invitation.expiresAt <= new Date()) {
      await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('Invitation has expired');
    }
    return invitation;
  }
}
