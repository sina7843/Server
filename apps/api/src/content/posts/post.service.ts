import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ContentPostType, ContentStatus } from '@dragon/types';
import { isValidContentStatus } from '../shared/content-status';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import { PostRepository, type PostListFilter } from './post.repository';
import type { PostDocument } from './post.schema';
import type { CreatePostInput, PostId, UpdatePostInput, UpdatePostSlugInput } from './post.types';

@Injectable()
export class PostService {
  constructor(private readonly postRepository: PostRepository) {}

  findById(id: PostId): Promise<PostDocument | null> {
    return this.postRepository.findById(id);
  }

  findByTypeAndSlug(type: ContentPostType, slugNormalized: string): Promise<PostDocument | null> {
    return this.postRepository.findByTypeAndSlug(type, slugNormalized);
  }

  findPublishedByTypeAndSlug(
    type: ContentPostType,
    slugNormalized: string,
  ): Promise<PostDocument | null> {
    return this.postRepository.findPublishedByTypeAndSlug(type, slugNormalized);
  }

  list(
    filter: PostListFilter,
    page: number,
    limit: number,
  ): Promise<{ items: PostDocument[]; total: number }> {
    return this.postRepository.list(filter, page, limit);
  }

  listTopPublished(limit: number): Promise<PostDocument[]> {
    return this.postRepository.findTopPublished(limit);
  }

  async isSlugTaken(
    type: ContentPostType,
    slugNormalized: string,
    excludeId?: PostId,
  ): Promise<boolean> {
    const existing = await this.postRepository.existsByTypeAndSlug(type, slugNormalized, excludeId);
    return existing !== null;
  }

  async create(input: CreatePostInput): Promise<PostDocument> {
    let slugNormalized: string;

    try {
      slugNormalized = normalizeSlug(input.slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    const taken = await this.isSlugTaken(input.type, slugNormalized);
    if (taken) {
      throw new ConflictException(
        `Slug "${input.slug}" is already taken for post type "${input.type}".`,
      );
    }

    return this.postRepository.create({ ...input, slugNormalized });
  }

  update(id: PostId, input: UpdatePostInput): Promise<PostDocument | null> {
    return this.postRepository.update(id, input);
  }

  async updateSlug(id: PostId, input: UpdatePostSlugInput): Promise<PostDocument> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    let slugNormalized: string;
    try {
      slugNormalized = normalizeSlug(input.slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    if (slugNormalized === post.slugNormalized) {
      return post;
    }

    const taken = await this.isSlugTaken(post.type, slugNormalized, id);
    if (taken) {
      throw new ConflictException(
        `Slug "${input.slug}" is already taken for post type "${post.type}".`,
      );
    }

    const updated = await this.postRepository.updateSlug(
      id,
      { slug: input.slug, slugNormalized },
      post.slugNormalized,
    );
    return updated!;
  }

  validateStatus(status: string): asserts status is ContentStatus {
    if (!isValidContentStatus(status)) {
      throw new ConflictException(
        `Invalid content status: "${status}". Must be one of: draft, published, archived.`,
      );
    }
  }

  async markPublished(id: PostId): Promise<PostDocument> {
    const updated = await this.postRepository.markPublished(id, new Date());
    if (!updated) {
      throw new NotFoundException('Post not found.');
    }
    return updated;
  }

  async markArchived(id: PostId): Promise<PostDocument> {
    const updated = await this.postRepository.markArchived(id);
    if (!updated) {
      throw new NotFoundException('Post not found.');
    }
    return updated;
  }

  async softDelete(id: PostId): Promise<PostDocument> {
    const updated = await this.postRepository.softDelete(id);
    if (!updated) {
      throw new NotFoundException('Post not found.');
    }
    return updated;
  }
}
