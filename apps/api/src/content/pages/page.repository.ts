import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page, type PageDocument } from './page.schema';
import type { CreatePageInput, PageId, UpdatePageInput, UpdatePageSlugInput } from './page.types';

@Injectable()
export class PageRepository {
  constructor(@InjectModel(Page.name) private readonly pageModel: Model<PageDocument>) {}

  findById(id: PageId): Promise<PageDocument | null> {
    return this.pageModel.findById(id).exec();
  }

  findBySlug(slugNormalized: string): Promise<PageDocument | null> {
    return this.pageModel.findOne({ slugNormalized, deletedAt: { $exists: false } }).exec();
  }

  existsBySlug(slugNormalized: string, excludeId?: PageId): Promise<PageDocument | null> {
    const filter: Record<string, unknown> = { slugNormalized };
    if (excludeId !== undefined) {
      filter._id = { $ne: excludeId };
    }
    return this.pageModel.findOne(filter).exec();
  }

  async create(input: CreatePageInput): Promise<PageDocument> {
    const doc: Record<string, unknown> = {
      title: input.title,
      slug: input.slug,
      slugNormalized: input.slugNormalized,
      slugHistory: [],
      bodyJson: input.bodyJson ?? {},
      bodyHtml: input.bodyHtml ?? '',
      status: input.status ?? 'draft',
      createdBy: input.createdBy,
      seo: {},
    };

    if (input.seo !== undefined) doc.seo = input.seo;

    const created = await this.pageModel.create(doc);
    return created as PageDocument;
  }

  update(id: PageId, input: UpdatePageInput): Promise<PageDocument | null> {
    const set: Record<string, unknown> = {};

    if (input.title !== undefined) set.title = input.title;
    if (input.bodyJson !== undefined) set.bodyJson = input.bodyJson;
    if (input.bodyHtml !== undefined) set.bodyHtml = input.bodyHtml;
    if (input.seo !== undefined) set.seo = input.seo;
    if (input.updatedBy !== undefined) set.updatedBy = input.updatedBy;

    return this.pageModel.findByIdAndUpdate(id, { $set: set }, { new: true }).exec();
  }

  updateSlug(id: PageId, input: UpdatePageSlugInput, oldSlugNormalized: string): Promise<PageDocument | null> {
    return this.pageModel
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

  markPublished(id: PageId, publishedAt: Date): Promise<PageDocument | null> {
    return this.pageModel
      .findByIdAndUpdate(
        id,
        { $set: { status: 'published', publishedAt } },
        { new: true },
      )
      .exec();
  }

  markArchived(id: PageId): Promise<PageDocument | null> {
    return this.pageModel
      .findByIdAndUpdate(id, { $set: { status: 'archived' } }, { new: true })
      .exec();
  }

  softDelete(id: PageId): Promise<PageDocument | null> {
    return this.pageModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }
}
