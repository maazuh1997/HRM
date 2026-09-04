import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { ApprovalModule } from '../workflows/approval.module';
import { OrganizationModule } from '../organizations/organization.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({ imports: [ApprovalModule, OrganizationModule, AuthorizationModule], controllers: [LeaveController], providers: [LeaveService], exports: [LeaveService] })
export class LeaveModule {}
