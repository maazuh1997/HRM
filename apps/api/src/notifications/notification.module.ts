import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationFactory } from './notification.factory';
import { LeaveNotificationHandler } from './leave-notification.handler';
import { EmailDeliveryWorker } from './email-delivery.worker';
import { SmtpEmailProvider } from './smtp-email.provider';
import { EMAIL_PROVIDER } from './email-provider.token';

@Module({ providers: [NotificationService, NotificationFactory, LeaveNotificationHandler, EmailDeliveryWorker, SmtpEmailProvider, { provide: EMAIL_PROVIDER, useExisting: SmtpEmailProvider }], exports: [NotificationService, NotificationFactory, EmailDeliveryWorker] })
export class NotificationModule {}
