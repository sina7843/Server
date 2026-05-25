import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';
import { ContentModule } from '../../content/content.module';
import { AdminContentPostsController } from './admin-content-posts.controller';
import { AdminContentPostsService } from './admin-content-posts.service';
import { AdminContentPagesController } from './admin-content-pages.controller';
import { AdminContentPagesService } from './admin-content-pages.service';
import { AdminContentCategoriesController } from './admin-content-categories.controller';
import { AdminContentTagsController } from './admin-content-tags.controller';

@Module({
  imports: [AuditModule, AnalyticsModule, AuthModule, RbacModule, ContentModule],
  controllers: [
    AdminContentPostsController,
    AdminContentPagesController,
    AdminContentCategoriesController,
    AdminContentTagsController,
  ],
  providers: [AdminContentPostsService, AdminContentPagesService],
})
export class AdminContentModule {}
