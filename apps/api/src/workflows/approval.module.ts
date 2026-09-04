import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalService } from './approval.service';
import { OrganizationModule } from '../organizations/organization.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({ imports: [OrganizationModule, AuthorizationModule], controllers: [ApprovalController], providers: [ApprovalService], exports: [ApprovalService] })
export class ApprovalModule {}
