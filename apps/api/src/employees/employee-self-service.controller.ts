import { Body, Controller, Get, Headers, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { EmployeeSelfService } from './employee-self-service.service';

class UpdateContactDto {
  email?: string;
  phone?: string;
}

@Controller('employees/me')
@UseGuards(AuthGuard)
export class EmployeeSelfServiceController {
  constructor(private readonly service: EmployeeSelfService) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser, @Headers('x-organization-id') organizationId: string) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.getMyProfile(user.id, organizationId);
  }

  @Patch('contact')
  updateContact(@CurrentUser() user: AuthenticatedUser, @Headers('x-organization-id') organizationId: string, @Body() body: UpdateContactDto) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.updateMyContact(user.id, organizationId, body.email, body.phone);
  }
}
