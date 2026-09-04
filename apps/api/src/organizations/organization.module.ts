import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { TenantGuard } from './tenant.guard';
import { RoleProvisioningService } from './role-provisioning.service';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, TenantGuard, RoleProvisioningService],
  exports: [OrganizationService, TenantGuard, RoleProvisioningService],
})
export class OrganizationModule {}
