import { Module } from '@nestjs/common';
import { RbacModule } from '../../rbac/rbac.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';

@Module({
  imports: [NotificationsModule, RbacModule],
  controllers: [AdminNotificationsController],
  providers: [AdminNotificationsService],
})
export class AdminNotificationsModule {}
