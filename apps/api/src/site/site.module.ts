import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { ContentModule } from '../content/content.module';
import { SiteSettings, SiteSettingsSchema } from './site-settings.schema';
import { ContactMessage, ContactMessageSchema } from './contact-message.schema';
import { SiteSettingsRepository } from './site-settings.repository';
import { SiteSettingsService } from './site-settings.service';
import { ContactMessageRepository } from './contact-message.repository';
import { ContactMessageService } from './contact-message.service';
import { ContactRateLimitGuard } from './contact-rate-limit.guard';
import { PublicSiteController } from './public/public-site.controller';
import { AdminSiteController } from './admin/admin-site.controller';

@Module({
  imports: [
    AuthModule,
    RbacModule,
    ContentModule,
    MongooseModule.forFeature([
      { name: SiteSettings.name, schema: SiteSettingsSchema },
      { name: ContactMessage.name, schema: ContactMessageSchema },
    ]),
  ],
  controllers: [PublicSiteController, AdminSiteController],
  providers: [
    SiteSettingsRepository,
    SiteSettingsService,
    ContactMessageRepository,
    ContactMessageService,
    ContactRateLimitGuard,
  ],
  exports: [SiteSettingsService, ContactMessageService],
})
export class SiteModule {}
