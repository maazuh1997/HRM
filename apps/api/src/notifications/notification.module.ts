import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationFactory } from './notification.factory';
import { LeaveNotificationHandler } from './leave-notification.handler';
import { EmailDeliveryWorker } from './email-delivery.worker';
import { EMAIL_PROVIDER } from './email-provider.token';
import type { EmailProvider } from './email-provider';

@Module({ providers: [NotificationService, NotificationFactory, LeaveNotificationHandler, EmailDeliveryWorker, { provide: EMAIL_PROVIDER, useFactory: (): EmailProvider => ({ send: async () => { throw new Error('Email provider is not configured'); } }) }], exports: [NotificationService, NotificationFactory, EmailDeliveryWorker] })
export class NotificationModule {}
