import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionService } from './session.service';
import { AuthenticatedRequest, SESSION_COOKIE } from './auth-context';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException('Authentication required');

    request.auth = await this.sessionService.resolve(token);
    return true;
  }
}
