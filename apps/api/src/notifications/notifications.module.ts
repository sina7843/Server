import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationLog,
  NotificationLogSchema,
} from '../auth/notifications/notification-log.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationTemplateRepository } from './notification-template.repository';
import { NotificationTemplate, NotificationTemplateSchema } from './notification-template.schema';
import { NotificationService } from './notification.service';
import { TournamentNotificationService } from './tournament-notification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
    ]),
    AuthModule,
  ],
  providers: [NotificationTemplateRepository, NotificationService, TournamentNotificationService],
  exports: [NotificationService, TournamentNotificationService],
})
export class NotificationsModule {}
