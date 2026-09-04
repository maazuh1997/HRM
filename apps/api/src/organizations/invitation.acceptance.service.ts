import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { prisma } from '@hrm/database';
import { createSessionToken, hashSessionToken } from '@hrm/auth';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

@Injectable()
export class InvitationAcceptanceService {
  async accept(token: string, password: string) {
    if (!token || token.length < 20) throw new BadRequestException('Invalid invitation token');
    if (!password || password.length < 12) throw new BadRequestException('Password must contain at least 12 characters');

    const tokenHash = createHash('sha256').update(token).digest('hex');

    return prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { tokenHash },
        include: { organization: true, role: true },
      });
      if (!invitation) throw new NotFoundException('Invitation not found');
      if (invitation.status !== 'PENDING') throw new BadRequestException('Invitation is no longer active');
      if (invitation.expiresAt <= new Date()) {
        await tx.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
        throw new BadRequestException('Invitation has expired');
      }

      const existingUser = await tx.user.findUnique({ where: { email: invitation.email } });
      const user = existingUser
        ? await tx.user.update({ where: { id: existingUser.id }, data: { status: 'ACTIVE' } })
        : await tx.user.create({ data: { email: invitation.email, passwordHash: password } });

      const membership = await tx.membership.upsert({
        where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
        create: { organizationId: invitation.organizationId, userId: user.id, status: 'ACTIVE' },
        update: { status: 'ACTIVE' },
      });

      if (invitation.roleId) {
        await tx.membershipRole.upsert({
          where: { membershipId_roleId: { membershipId: membership.id, roleId: invitation.roleId } },
          create: { membershipId: membership.id, roleId: invitation.roleId },
          update: {},
        });
      }

      const sessionToken = createSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      const session = await tx.session.create({
        data: { userId: user.id, tokenHash: hashSessionToken(sessionToken), expiresAt },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date(), userId: user.id },
      });

      return {
        user: { id: user.id, email: user.email },
        organization: invitation.organization,
        membership,
        role: invitation.role,
        session: { token: sessionToken, expiresAt: session.expiresAt },
      };
    });
  }
}
