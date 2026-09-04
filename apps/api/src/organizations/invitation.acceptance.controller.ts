import { Body, Controller, Post } from '@nestjs/common';
import { InvitationAcceptanceService } from './invitation.acceptance.service';

class AcceptInvitationDto {
  token!: string;
  password!: string;
}

@Controller('organizations/invitations')
export class InvitationAcceptanceController {
  constructor(private readonly invitationAcceptanceService: InvitationAcceptanceService) {}

  @Post('accept')
  accept(@Body() body: AcceptInvitationDto) {
    return this.invitationAcceptanceService.accept(body.token, body.password);
  }
}
