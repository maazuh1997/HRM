import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { TenantGuard } from './tenant.guard';
import { RoleProvisioningService } from './role-provisioning.service';
import { InvitationService } from './invitation.service';
import { InvitationAcceptanceService } from './invitation.acceptance.service';
import { InvitationController } from './invitation.controller';
import { InvitationAcceptanceController } from './invitation.acceptance.controller';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController, InvitationController, InvitationAcceptanceController],
  providers: [OrganizationService, TenantGuard, RoleProvisioningService, InvitationService, InvitationAcceptanceService],
  exports: [OrganizationService, TenantGuard, RoleProvisioningService, InvitationService],
})
export class OrganizationModule {}
