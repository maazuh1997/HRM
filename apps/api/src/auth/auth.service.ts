import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hashPassword, validatePassword, verifyPassword } from '@hrm/auth';
import { prisma } from '@hrm/database';

@Injectable()
export class AuthService {
  async register(email: string, password: string) {
    const errors = validatePassword(password);
    if (errors.length) throw new Error(errors.join('; '));

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new Error('An account with this email already exists');

    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash: await hashPassword(password) },
      select: { id: true, email: true, status: true, emailVerifiedAt: true },
    });

    return user;
  }

  async authenticate(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user?.passwordHash || user.status !== 'ACTIVE' || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return { id: user.id, email: user.email };
  }
}
