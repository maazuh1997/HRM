import 'reflect-metadata';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { Controller, Get, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organizations/organization.module';
import { LicenseModule } from './licensing/license.module';
import { LeaveModule } from './leave/leave.module';
import { ApprovalModule } from './workflows/approval.module';
import { AuditModule } from './audit/audit.module';

@Controller('health')
class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok', service: 'api' };
  }
}

@Module({ imports: [AuthModule, OrganizationModule, LicenseModule, ApprovalModule, LeaveModule, AuditModule], controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.API_PORT ?? 4000);
}

void bootstrap();
