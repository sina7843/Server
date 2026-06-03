import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from '../content/posts/post.schema';
import { Page, PageSchema } from '../content/pages/page.schema';
import { User, UserSchema } from '../auth/users/user.schema';
import { MediaAsset, MediaAssetSchema } from '../media/media-asset.schema';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { JobsModule } from '../jobs/jobs.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { SearchService } from './search.service';
import { MongoSearchAdapter } from './mongo-search.adapter';
import { PublicSearchController } from './public-search.controller';
import { AdminSearchController } from './admin-search.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Page.name, schema: PageSchema },
      { name: User.name, schema: UserSchema },
      { name: MediaAsset.name, schema: MediaAssetSchema },
    ]),
    AuthModule,
    JobsModule,
    RbacModule,
    TournamentsModule,
  ],
  controllers: [PublicSearchController, AdminSearchController],
  providers: [MongoSearchAdapter, { provide: SearchService, useExisting: MongoSearchAdapter }],
  exports: [SearchService],
})
export class SearchModule {}
