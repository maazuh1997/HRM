import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '@hrm/auth';
import { LicenseService } from './license.service';

class ActivateLicenseDto {
  payload!: string;
  signature!: string;
  keyId!: string;
}

@Controller('licenses')
@UseGuards(AuthGuard)
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Post('activate')
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('x-organization-id') organizationId: string,
    @Headers('x-license-public-key') publicKeyPem: string,
    @Body() body: ActivateLicenseDto,
  ) {
    if (!organizationId) throw new Error('Organization context is required');
    if (!publicKeyPem) throw new Error('License verification key is not configured');
    return this.licenseService.activate(organizationId, body, publicKeyPem);
  }
}
