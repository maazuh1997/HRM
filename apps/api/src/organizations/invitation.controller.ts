import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { InvitationService } from './invitation.service';

class CreateInvitationDto {
  email!: string;
  roleId?: string;
}

@Controller('organizations/invitations')
@UseGuards(AuthGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-id') organizationId: string,
    @Body() body: CreateInvitationDto,
  ) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.invitationService.create(organizationId, user.id, body.email, body.roleId);
  }
}
