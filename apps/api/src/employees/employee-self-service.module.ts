import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmployeeSelfService } from './employee-self-service.service';
import { EmployeeSelfServiceController } from './employee-self-service.controller';

@Module({
  imports: [AuthModule],
  controllers: [EmployeeSelfServiceController],
  providers: [EmployeeSelfService],
  exports: [EmployeeSelfService],
})
export class EmployeeSelfServiceModule {}
