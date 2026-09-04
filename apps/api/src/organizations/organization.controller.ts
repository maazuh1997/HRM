import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { OrganizationService } from './organization.service';

class CreateOrganizationDto {
  name!: string;
}

@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateOrganizationDto) {
    return this.organizationService.createForUser(user.id, body.name);
  }

  @Get('current')
  current(@CurrentUser() user: AuthenticatedUser, @Headers('x-organization-id') organizationId?: string) {
    if (!organizationId) return { organization: null, message: 'Select an organization' };
    return this.organizationService.getMembership(user.id, organizationId);
  }
}
