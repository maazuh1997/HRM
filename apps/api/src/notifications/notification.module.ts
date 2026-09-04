import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationFactory } from './notification.factory';

@Module({ providers: [NotificationService, NotificationFactory], exports: [NotificationService, NotificationFactory] })
export class NotificationModule {}
