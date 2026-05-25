import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from '../analytics/analytics.module';
import { Category, CategorySchema } from './categories/category.schema';
import { CategoryRepository } from './categories/category.repository';
import { CategoryService } from './categories/category.service';
import { Tag, TagSchema } from './tags/tag.schema';
import { TagRepository } from './tags/tag.repository';
import { TagService } from './tags/tag.service';
import { Post, PostSchema } from './posts/post.schema';
import { PostRepository } from './posts/post.repository';
import { PostService } from './posts/post.service';
import { Page, PageSchema } from './pages/page.schema';
import { PageRepository } from './pages/page.repository';
import { PageService } from './pages/page.service';
import { ContentRevision, ContentRevisionSchema } from './revisions/content-revision.schema';
import { ContentRevisionRepository } from './revisions/content-revision.repository';
import { ContentRevisionService } from './revisions/content-revision.service';
import { RichTextValidator } from './rich-text/rich-text-validator';
import { HtmlSanitizer } from './rich-text/html-sanitizer';
import { PublicPostsService } from './public/public-posts.service';
import { PublicNewsController } from './public/public-news.controller';
import { PublicArticlesController } from './public/public-articles.controller';
import { PublicAnnouncementsController } from './public/public-announcements.controller';
import { PublicGuidesController } from './public/public-guides.controller';
import { PublicRulesController } from './public/public-rules.controller';
import { PublicPagesController } from './public/public-pages.controller';
import { PublicCategoriesController } from './public/public-categories.controller';
import { PublicTagsController } from './public/public-tags.controller';

@Module({
  imports: [
    AnalyticsModule,
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Tag.name, schema: TagSchema },
      { name: Post.name, schema: PostSchema },
      { name: Page.name, schema: PageSchema },
      { name: ContentRevision.name, schema: ContentRevisionSchema },
    ]),
  ],
  controllers: [
    PublicNewsController,
    PublicArticlesController,
    PublicAnnouncementsController,
    PublicGuidesController,
    PublicRulesController,
    PublicPagesController,
    PublicCategoriesController,
    PublicTagsController,
  ],
  providers: [
    CategoryRepository,
    CategoryService,
    TagRepository,
    TagService,
    PostRepository,
    PostService,
    PageRepository,
    PageService,
    ContentRevisionRepository,
    ContentRevisionService,
    PublicPostsService,
    RichTextValidator,
    HtmlSanitizer,
  ],
  exports: [
    CategoryService,
    TagService,
    PostService,
    PageService,
    ContentRevisionService,
    RichTextValidator,
    HtmlSanitizer,
  ],
})
export class ContentModule {}
