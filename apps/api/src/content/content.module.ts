import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Tag.name, schema: TagSchema },
      { name: Post.name, schema: PostSchema },
      { name: Page.name, schema: PageSchema },
      { name: ContentRevision.name, schema: ContentRevisionSchema },
    ]),
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
  ],
  exports: [
    CategoryService,
    TagService,
    PostService,
    PageService,
    ContentRevisionService,
  ],
})
export class ContentModule {}
