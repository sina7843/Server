import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ContentPostType } from '@dragon/types';
import { Post, type PostDocument } from './post.schema';
import type { CreatePostInput, PostId, UpdatePostInput, UpdatePostSlugInput } from './post.types';

@Injectable()
export class PostRepository {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<PostDocument>) {}

  findById(id: PostId): Promise<PostDocument | null> {
    return this.postModel.findById(id).exec();
  }

  findByTypeAndSlug(type: ContentPostType, slugNormalized: string): Promise<PostDocument | null> {
    return this.postModel.findOne({ type, slugNormalized, deletedAt: { $exists: false } }).exec();
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
      mediaRefs: [],
      viewCount: 0,
      seo: {},
    };

    if (input.excerpt !== undefined) doc.excerpt = input.excerpt;
    if (input.seo !== undefined) doc.seo = input.seo;

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

    return this.postModel.findByIdAndUpdate(id, { $set: set }, { new: true }).exec();
  }

  updateSlug(id: PostId, input: UpdatePostSlugInput, oldSlugNormalized: string): Promise<PostDocument | null> {
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
      .findByIdAndUpdate(
        id,
        { $set: { status: 'published', publishedAt } },
        { new: true },
      )
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
}
