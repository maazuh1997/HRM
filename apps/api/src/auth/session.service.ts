import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hashSessionToken, createSessionToken } from '@hrm/auth';
import { prisma } from '@hrm/database';

const SESSION_DAYS = 30;

@Injectable()
export class SessionService {
  async create(userId: string) {
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { token, expiresAt };
  }

  async resolve(token: string) {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    return {
      sessionId: session.id,
      user: { id: session.user.id, email: session.user.email },
    };
  }

  async revoke(token: string) {
    await prisma.session.updateMany({
      where: { tokenHash: hashSessionToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
