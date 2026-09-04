import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { OrganizationModule } from '../organizations/organization.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { AuditModule } from '../audit/audit.module';

@Module({ imports: [OrganizationModule, AuthorizationModule, AuditModule], controllers: [ApprovalController], providers: [ApprovalService], exports: [ApprovalService] })
export class ApprovalModule {}
