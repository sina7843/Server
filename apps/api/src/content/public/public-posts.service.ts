import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import type { ContentPostType } from '@dragon/types';
import type { Types } from 'mongoose';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import { PostService } from '../posts/post.service';
import { PostRepository } from '../posts/post.repository';
import { AnalyticsService } from '../../analytics/analytics.service';
import type { PostDocument } from '../posts/post.schema';
import { UserProfileRepository } from '../../profiles/profile.repository';
import { MediaAssetRepository } from '../../media/media-asset.repository';
import { STORAGE_SERVICE, type StorageService } from '../../storage/storage.service';
import type { EnrichedPost } from './dto/public-post-response';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface PublicListQuery {
  readonly page: number;
  readonly limit: number;
}

@Injectable()
export class PublicPostsService {
  constructor(
    private readonly postService: PostService,
    private readonly postRepository: PostRepository,
    @Optional() private readonly analyticsService?: AnalyticsService,
    @Optional() @Inject(UserProfileRepository) private readonly profileRepository?: UserProfileRepository,
    @Optional() @Inject(MediaAssetRepository) private readonly mediaAssetRepository?: MediaAssetRepository,
    @Optional() @Inject(STORAGE_SERVICE) private readonly storageService?: StorageService,
  ) {}

  async listPublished(
    type: ContentPostType,
    query: PublicListQuery,
  ): Promise<{ items: EnrichedPost[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, query.page);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit));
    const { items, total } = await this.postService.list(
      { type, status: 'published', includeDeleted: false },
      page,
      limit,
    );
    const enriched = await this.enrichPosts(items);
    return { items: enriched, total, page, limit };
  }

  async getPublished(type: ContentPostType, rawSlug: string): Promise<EnrichedPost> {
    let slugNormalized: string;
    try {
      slugNormalized = normalizeSlug(rawSlug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new NotFoundException('Post not found.');
      }
      throw err;
    }

    const post = await this.postService.findPublishedByTypeAndSlug(type, slugNormalized);
    if (!post) throw new NotFoundException('Post not found.');

    this.analyticsService?.track({
      type: 'content.viewed',
      resourceType: post.type,
      resourceId: String(post._id),
    });
    void this.postRepository.incrementViewCount(post._id).catch(() => undefined);

    return this.enrichPost(post);
  }

  private async enrichPost(post: PostDocument): Promise<EnrichedPost> {
    const [profile, mediaAsset] = await Promise.all([
      this.profileRepository
        ? this.profileRepository.findByUserId(post.authorId).catch(() => null)
        : Promise.resolve(null),
      this.mediaAssetRepository && post.coverMediaId
        ? this.mediaAssetRepository.findById(post.coverMediaId).catch(() => null)
        : Promise.resolve(null),
    ]);

    const authorName = profile?.displayName;
    const coverImageUrl =
      mediaAsset && this.storageService
        ? this.storageService.getPublicUrl(mediaAsset.objectKey)
        : undefined;
    return {
      post,
      ...(authorName !== undefined ? { authorName } : {}),
      ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
    };
  }

  private async enrichPosts(posts: PostDocument[]): Promise<EnrichedPost[]> {
    if (!posts.length) return [];

    const authorIds = [...new Set(posts.map((p) => String(p.authorId)))];
    const coverIds = posts
      .filter((p) => p.coverMediaId)
      .map((p) => p.coverMediaId as Types.ObjectId);

    const [profiles, mediaAssets] = await Promise.all([
      this.profileRepository
        ? this.profileRepository.findManyByUserIds(authorIds).catch(() => [])
        : Promise.resolve([]),
      this.mediaAssetRepository && coverIds.length
        ? this.mediaAssetRepository.findManyByIds(coverIds).catch(() => [])
        : Promise.resolve([]),
    ]);

    const profileMap = new Map(profiles.map((p) => [String(p.userId), p.displayName]));
    const mediaMap = new Map(mediaAssets.map((m) => [String(m._id), m.objectKey]));

    return posts.map((post) => {
      const objectKey = post.coverMediaId ? mediaMap.get(String(post.coverMediaId)) : undefined;
      const authorName = profileMap.get(String(post.authorId));
      const coverImageUrl =
        objectKey && this.storageService ? this.storageService.getPublicUrl(objectKey) : undefined;
      return {
        post,
        ...(authorName !== undefined ? { authorName } : {}),
        ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
      };
    });
  }
}

export function parsePublicListQuery(raw: unknown): PublicListQuery {
  const query = raw as Record<string, unknown>;
  const pageRaw = query.page !== undefined ? Number(query.page) : DEFAULT_PAGE;
  const limitRaw = query.limit !== undefined ? Number(query.limit) : DEFAULT_LIMIT;
  return {
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : DEFAULT_PAGE,
    limit:
      Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_LIMIT) : DEFAULT_LIMIT,
  };
}
