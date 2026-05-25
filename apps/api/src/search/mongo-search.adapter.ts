import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { FilterQuery } from 'mongoose';
import type { SearchScope, SearchResultItemDto } from '@dragon/types';
import { maskPhone } from '../auth/security/masking';
import { Post } from '../content/posts/post.schema';
import type { PostDocument } from '../content/posts/post.schema';
import { Page } from '../content/pages/page.schema';
import type { PageDocument } from '../content/pages/page.schema';
import { User } from '../auth/users/user.schema';
import type { UserDocument } from '../auth/users/user.schema';
import { MediaAsset } from '../media/media-asset.schema';
import type { MediaAssetDocument } from '../media/media-asset.schema';
import { SearchService } from './search.service';
import type {
  SearchResult,
  SearchInput,
  ParsedPublicContentSearchQuery,
  ParsedAdminSearchQuery,
  IndexSearchInput,
  RemoveSearchInput,
} from './search.service';

const POST_TYPE_ROUTE_MAP: Record<string, string> = {
  news: '/news',
  article: '/articles',
  announcement: '/announcements',
  guide: '/guides',
  rule: '/rules',
};

// Phase 0: in-memory merge limit per collection when searching across multiple collections.
const MERGE_FETCH_CAP = 500;

@Injectable()
export class MongoSearchAdapter extends SearchService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    @InjectModel(Page.name) private readonly pageModel: Model<PageDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(MediaAsset.name) private readonly mediaModel: Model<MediaAssetDocument>,
  ) {
    super();
  }

  async searchPublicContent(query: ParsedPublicContentSearchQuery): Promise<SearchResult> {
    const { q, type, categoryId, tagId, page, limit } = query;
    const skip = (page - 1) * limit;

    const allItems: SearchResultItemDto[] = [];
    let total = 0;

    const hasTagFilter = categoryId !== undefined || tagId !== undefined;
    const searchPosts = !type || type !== 'page';
    const searchPages = (!type || type === 'page') && !hasTagFilter;

    if (searchPosts) {
      const postFilter: FilterQuery<Post> = {
        status: 'published',
        deletedAt: { $exists: false },
        ...(type && type !== 'page' ? { type } : {}),
        ...(categoryId ? { categoryIds: new Types.ObjectId(categoryId) } : {}),
        ...(tagId ? { tagIds: new Types.ObjectId(tagId) } : {}),
        ...(q ? { $text: { $search: q } } : {}),
      };

      const [posts, postTotal] = await Promise.all([
        this.postModel
          .find(postFilter)
          .select('type title excerpt slug publishedAt createdAt updatedAt')
          .sort({ createdAt: -1 })
          .limit(MERGE_FETCH_CAP)
          .lean()
          .exec(),
        this.postModel.countDocuments(postFilter).exec(),
      ]);

      total += postTotal;
      for (const post of posts) {
        const routeBase = POST_TYPE_ROUTE_MAP[post.type] ?? '/content';
        allItems.push({
          id: String(post._id),
          type: post.type,
          title: post.title,
          ...(post.excerpt ? { excerpt: post.excerpt } : {}),
          slug: post.slug,
          route: `${routeBase}/${post.slug}`,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        });
      }
    }

    if (searchPages) {
      const pageFilter: FilterQuery<Page> = {
        status: 'published',
        deletedAt: { $exists: false },
        ...(q ? { $text: { $search: q } } : {}),
      };

      const [pages, pageTotal] = await Promise.all([
        this.pageModel
          .find(pageFilter)
          .select('title slug publishedAt createdAt updatedAt')
          .sort({ createdAt: -1 })
          .limit(MERGE_FETCH_CAP)
          .lean()
          .exec(),
        this.pageModel.countDocuments(pageFilter).exec(),
      ]);

      total += pageTotal;
      for (const pg of pages) {
        allItems.push({
          id: String(pg._id),
          type: 'page',
          title: pg.title,
          slug: pg.slug,
          route: `/pages/${pg.slug}`,
          createdAt: pg.createdAt.toISOString(),
          updatedAt: pg.updatedAt.toISOString(),
        });
      }
    }

    allItems.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    return {
      items: allItems.slice(skip, skip + limit),
      page,
      limit,
      total,
    };
  }

  async searchAdminContent(query: ParsedAdminSearchQuery): Promise<SearchResult> {
    const { q, page, limit } = query;
    const skip = (page - 1) * limit;

    const postFilter: FilterQuery<Post> = {
      deletedAt: { $exists: false },
      ...(q ? { $text: { $search: q } } : {}),
    };

    const pageFilter: FilterQuery<Page> = {
      deletedAt: { $exists: false },
      ...(q ? { $text: { $search: q } } : {}),
    };

    const [posts, postTotal, pages, pageTotal] = await Promise.all([
      this.postModel
        .find(postFilter)
        .select('type title excerpt slug status createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(MERGE_FETCH_CAP)
        .lean()
        .exec(),
      this.postModel.countDocuments(postFilter).exec(),
      this.pageModel
        .find(pageFilter)
        .select('title slug status createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(MERGE_FETCH_CAP)
        .lean()
        .exec(),
      this.pageModel.countDocuments(pageFilter).exec(),
    ]);

    const allItems: SearchResultItemDto[] = [];

    for (const post of posts) {
      const routeBase = POST_TYPE_ROUTE_MAP[post.type] ?? '/content';
      allItems.push({
        id: String(post._id),
        type: post.type,
        title: post.title,
        ...(post.excerpt ? { excerpt: post.excerpt } : {}),
        slug: post.slug,
        route: `${routeBase}/${post.slug}`,
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      });
    }

    for (const pg of pages) {
      allItems.push({
        id: String(pg._id),
        type: 'page',
        title: pg.title,
        slug: pg.slug,
        route: `/pages/${pg.slug}`,
        status: pg.status,
        createdAt: pg.createdAt.toISOString(),
        updatedAt: pg.updatedAt.toISOString(),
      });
    }

    allItems.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });

    return {
      items: allItems.slice(skip, skip + limit),
      page,
      limit,
      total: postTotal + pageTotal,
    };
  }

  async searchAdminUsers(query: ParsedAdminSearchQuery): Promise<SearchResult> {
    const { q, page, limit } = query;
    const skip = (page - 1) * limit;

    const userFilter: FilterQuery<User> = {
      deletedAt: { $exists: false },
      ...(q
        ? { phoneNormalized: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }
        : {}),
    };

    const [users, total] = await Promise.all([
      this.userModel
        .find(userFilter)
        .select('phoneNormalized status createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(userFilter).exec(),
    ]);

    const items: SearchResultItemDto[] = users.map((user) => ({
      id: String(user._id),
      type: 'user',
      title: maskPhone(user.phoneNormalized),
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return { items, page, limit, total };
  }

  async searchAdminMedia(query: ParsedAdminSearchQuery): Promise<SearchResult> {
    const { q, page, limit } = query;
    const skip = (page - 1) * limit;

    const safePattern = q ? q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

    const mediaFilter: FilterQuery<MediaAsset> = {
      deletedAt: { $exists: false },
      ...(q
        ? {
            $or: [
              { originalName: { $regex: safePattern, $options: 'i' } },
              { alt: { $regex: safePattern, $options: 'i' } },
              { caption: { $regex: safePattern, $options: 'i' } },
            ],
          }
        : {}),
    };

    const [assets, total] = await Promise.all([
      this.mediaModel
        .find(mediaFilter)
        .select('originalName mimeType status createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.mediaModel.countDocuments(mediaFilter).exec(),
    ]);

    const items: SearchResultItemDto[] = assets.map((asset) => ({
      id: String(asset._id),
      type: 'media',
      title: asset.originalName,
      status: asset.status,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    }));

    return { items, page, limit, total };
  }

  async search(input: SearchInput): Promise<SearchResult> {
    switch (input.kind) {
      case 'public_content':
        return this.searchPublicContent(input.query);
      case 'admin_content':
        return this.searchAdminContent(input.query);
      case 'admin_users':
        return this.searchAdminUsers(input.query);
      case 'admin_media':
        return this.searchAdminMedia(input.query);
    }
  }

  async index(input: IndexSearchInput): Promise<void> {
    void input;
    // Phase 0: no external index — no-op.
  }

  async remove(input: RemoveSearchInput): Promise<void> {
    void input;
    // Phase 0: no external index — no-op.
  }

  async reindex(scope?: SearchScope): Promise<void> {
    void scope;
    // Phase 0: MongoSearchAdapter reads directly from source collections at query time.
    // No external index to rebuild. This is a no-op — reindex is meaningful only when
    // an external search engine (e.g., Meilisearch) is configured in a later phase.
  }
}
