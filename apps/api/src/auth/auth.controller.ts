import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

class CredentialsDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: CredentialsDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  login(@Body() body: CredentialsDto) {
    return this.authService.authenticate(body.email, body.password);
  }
}
