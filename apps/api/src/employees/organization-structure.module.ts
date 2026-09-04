import { Module } from '@nestjs/common';
import { OrganizationStructureController } from './organization-structure.controller';
import { OrganizationStructureService } from './organization-structure.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationStructureController],
  providers: [OrganizationStructureService],
  exports: [OrganizationStructureService],
})
export class OrganizationStructureModule {}
