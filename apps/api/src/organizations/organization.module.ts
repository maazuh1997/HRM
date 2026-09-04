import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { TenantGuard } from './tenant.guard';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController],
  providers: [OrganizationService, TenantGuard],
  exports: [OrganizationService, TenantGuard],
})
export class OrganizationModule {}
