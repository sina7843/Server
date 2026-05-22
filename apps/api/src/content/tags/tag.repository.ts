import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tag, type TagDocument } from './tag.schema';
import type { CreateTagInput, TagId, UpdateTagInput } from './tag.types';

@Injectable()
export class TagRepository {
  constructor(@InjectModel(Tag.name) private readonly tagModel: Model<TagDocument>) {}

  findById(id: TagId): Promise<TagDocument | null> {
    return this.tagModel.findById(id).exec();
  }

  findBySlug(slugNormalized: string): Promise<TagDocument | null> {
    return this.tagModel.findOne({ slugNormalized }).exec();
  }

  existsBySlug(slugNormalized: string, excludeId?: TagId): Promise<TagDocument | null> {
    const filter: Record<string, unknown> = { slugNormalized };
    if (excludeId !== undefined) {
      filter._id = { $ne: excludeId };
    }
    return this.tagModel.findOne(filter).exec();
  }

  list(): Promise<TagDocument[]> {
    return this.tagModel.find({}).exec();
  }

  async create(input: CreateTagInput): Promise<TagDocument> {
    const created = await this.tagModel.create({
      name: input.name,
      slug: input.slug,
      slugNormalized: input.slugNormalized,
    });
    return created as TagDocument;
  }

  update(id: TagId, input: UpdateTagInput): Promise<TagDocument | null> {
    const set: Record<string, unknown> = {};
    if (input.name !== undefined) set.name = input.name;
    return this.tagModel.findByIdAndUpdate(id, { $set: set }, { new: true }).exec();
  }
}
