import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

class CredentialsDto {
  email!: string;
  password!: string;
}

const sessionCookie = 'hrm_session';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register')
  async register(@Body() body: CredentialsDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: CredentialsDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.authenticate(body.email, body.password);
    const session = await this.sessionService.create(user.id);

    response.cookie(sessionCookie, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
      path: '/',
    });

    return user;
  }
}
