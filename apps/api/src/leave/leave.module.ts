import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { ApprovalModule } from '../workflows/approval.module';
import { OrganizationModule } from '../organizations/organization.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditModule } from '../audit/audit.module';

@Module({ imports: [ApprovalModule, OrganizationModule, AuthorizationModule, AuditModule], controllers: [LeaveController], providers: [LeaveService], exports: [LeaveService] })
export class LeaveModule {}
