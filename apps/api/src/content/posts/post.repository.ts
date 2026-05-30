import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ContentPostType, ContentStatus } from '@dragon/types';
import { Post, type PostDocument } from './post.schema';
import type { CreatePostInput, PostId, UpdatePostInput, UpdatePostSlugInput } from './post.types';

export interface PostListFilter {
  readonly type?: ContentPostType;
  readonly status?: ContentStatus;
  readonly includeDeleted?: boolean;
}

@Injectable()
export class PostRepository {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<PostDocument>) {}

  findById(id: PostId): Promise<PostDocument | null> {
    return this.postModel.findById(id).exec();
  }

  findByTypeAndSlug(type: ContentPostType, slugNormalized: string): Promise<PostDocument | null> {
    return this.postModel.findOne({ type, slugNormalized, deletedAt: { $exists: false } }).exec();
  }

  findPublishedByTypeAndSlug(
    type: ContentPostType,
    slugNormalized: string,
  ): Promise<PostDocument | null> {
    return this.postModel
      .findOne({ type, slugNormalized, status: 'published', deletedAt: { $exists: false } })
      .exec();
  }

  existsByTypeAndSlug(
    type: ContentPostType,
    slugNormalized: string,
    excludeId?: PostId,
  ): Promise<PostDocument | null> {
    const filter: Record<string, unknown> = { type, slugNormalized };
    if (excludeId !== undefined) {
      filter._id = { $ne: excludeId };
    }
    return this.postModel.findOne(filter).exec();
  }

  async list(
    filter: PostListFilter,
    page: number,
    limit: number,
  ): Promise<{ items: PostDocument[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filter.type !== undefined) query.type = filter.type;
    if (filter.status !== undefined) query.status = filter.status;
    if (!filter.includeDeleted) query.deletedAt = { $exists: false };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.postModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.postModel.countDocuments(query).exec(),
    ]);
    return { items, total };
  }

  async create(input: CreatePostInput): Promise<PostDocument> {
    const doc: Record<string, unknown> = {
      type: input.type,
      title: input.title,
      slug: input.slug,
      slugNormalized: input.slugNormalized,
      slugHistory: [],
      bodyJson: input.bodyJson ?? {},
      bodyHtml: input.bodyHtml ?? '',
      authorId: input.authorId,
      status: input.status ?? 'draft',
      categoryIds: input.categoryIds ?? [],
      tagIds: input.tagIds ?? [],
      mediaRefs: input.mediaRefs ?? [],
      viewCount: 0,
      seo: {},
    };

    if (input.excerpt !== undefined) doc.excerpt = input.excerpt;
    if (input.seo !== undefined) doc.seo = input.seo;
    if (input.coverMediaId !== undefined && input.coverMediaId !== null) {
      doc.coverMediaId = input.coverMediaId;
    }

    const created = await this.postModel.create(doc);
    return created as PostDocument;
  }

  update(id: PostId, input: UpdatePostInput): Promise<PostDocument | null> {
    const set: Record<string, unknown> = {};

    if (input.title !== undefined) set.title = input.title;
    if (input.excerpt !== undefined) set.excerpt = input.excerpt;
    if (input.bodyJson !== undefined) set.bodyJson = input.bodyJson;
    if (input.bodyHtml !== undefined) set.bodyHtml = input.bodyHtml;
    if (input.seo !== undefined) set.seo = input.seo;
    if (input.categoryIds !== undefined) set.categoryIds = input.categoryIds;
    if (input.tagIds !== undefined) set.tagIds = input.tagIds;
    if (input.mediaRefs !== undefined) set.mediaRefs = input.mediaRefs;

    const unset: Record<string, 1> = {};
    if (input.coverMediaId === null) {
      unset.coverMediaId = 1;
    } else if (input.coverMediaId !== undefined) {
      set.coverMediaId = input.coverMediaId;
    }

    const op: Record<string, unknown> = { $set: set };
    if (Object.keys(unset).length > 0) op.$unset = unset;

    return this.postModel.findByIdAndUpdate(id, op, { new: true }).exec();
  }

  updateSlug(
    id: PostId,
    input: UpdatePostSlugInput,
    oldSlugNormalized: string,
  ): Promise<PostDocument | null> {
    return this.postModel
      .findByIdAndUpdate(
        id,
        {
          $set: { slug: input.slug, slugNormalized: input.slugNormalized },
          $push: { slugHistory: oldSlugNormalized },
        },
        { new: true },
      )
      .exec();
  }

  markPublished(id: PostId, publishedAt: Date): Promise<PostDocument | null> {
    return this.postModel
      .findByIdAndUpdate(id, { $set: { status: 'published', publishedAt } }, { new: true })
      .exec();
  }

  markArchived(id: PostId): Promise<PostDocument | null> {
    return this.postModel
      .findByIdAndUpdate(id, { $set: { status: 'archived' } }, { new: true })
      .exec();
  }

  softDelete(id: PostId): Promise<PostDocument | null> {
    return this.postModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }

  incrementViewCount(id: PostId): Promise<void> {
    return this.postModel
      .findByIdAndUpdate(id, { $inc: { viewCount: 1 } })
      .exec()
      .then(() => undefined);
  }

  findTopPublished(limit: number): Promise<PostDocument[]> {
    return this.postModel
      .find({ status: 'published', deletedAt: { $exists: false } })
      .sort({ viewCount: -1, publishedAt: -1 })
      .limit(limit)
      .exec();
  }
}
