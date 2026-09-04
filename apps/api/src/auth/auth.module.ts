import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { SessionService } from './session.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, SessionService],
  exports: [AuthService, AuthGuard, SessionService],
})
export class AuthModule {}
