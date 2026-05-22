import { Injectable, NotFoundException } from '@nestjs/common';
import type { ContentPostType } from '@dragon/types';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import { PostService } from '../posts/post.service';
import type { PostDocument } from '../posts/post.schema';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface PublicListQuery {
  readonly page: number;
  readonly limit: number;
}

@Injectable()
export class PublicPostsService {
  constructor(private readonly postService: PostService) {}

  async listPublished(
    type: ContentPostType,
    query: PublicListQuery,
  ): Promise<{ items: PostDocument[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, query.page);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit));
    const { items, total } = await this.postService.list(
      { type, status: 'published', includeDeleted: false },
      page,
      limit,
    );
    return { items, total, page, limit };
  }

  async getPublished(type: ContentPostType, rawSlug: string): Promise<PostDocument> {
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
    return post;
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
