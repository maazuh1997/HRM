import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { ApprovalModule } from '../workflows/approval.module';

@Module({ imports: [ApprovalModule], controllers: [LeaveController], providers: [LeaveService], exports: [LeaveService] })
export class LeaveModule {}
