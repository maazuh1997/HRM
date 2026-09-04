import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { SESSION_COOKIE } from './auth-context';

class CredentialsDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('register')
  register(@Body() body: CredentialsDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: CredentialsDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.authenticate(body.email, body.password);
    const session = await this.sessionService.create(user.id);

    response.cookie(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
      path: '/',
    });

    return user;
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) response: Response) {
    void user;
    response.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', path: '/' });
    return { success: true };
  }
}
