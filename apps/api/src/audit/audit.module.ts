import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { OrganizationModule } from '../organizations/organization.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({ imports: [OrganizationModule, AuthorizationModule], controllers: [AuditController], providers: [AuditService], exports: [AuditService] })
export class AuditModule {}
