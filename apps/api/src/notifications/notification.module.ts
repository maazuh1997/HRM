import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationFactory } from './notification.factory';
import { LeaveNotificationHandler } from './leave-notification.handler';

@Module({ providers: [NotificationService, NotificationFactory, LeaveNotificationHandler], exports: [NotificationService, NotificationFactory] })
export class NotificationModule {}
