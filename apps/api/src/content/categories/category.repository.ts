import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, type CategoryDocument } from './category.schema';
import type { CategoryId, CreateCategoryInput, UpdateCategoryInput } from './category.types';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  findById(id: CategoryId): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).exec();
  }

  findBySlug(slugNormalized: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findOne({ slugNormalized, deletedAt: { $exists: false } }).exec();
  }

  existsBySlug(slugNormalized: string, excludeId?: CategoryId): Promise<CategoryDocument | null> {
    const filter: Record<string, unknown> = { slugNormalized };
    if (excludeId !== undefined) {
      filter._id = { $ne: excludeId };
    }
    return this.categoryModel.findOne(filter).exec();
  }

  list(includeDeleted = false): Promise<CategoryDocument[]> {
    const filter = includeDeleted ? {} : { deletedAt: { $exists: false } };
    return this.categoryModel.find(filter).sort({ sortOrder: 1 }).exec();
  }

  async create(input: CreateCategoryInput): Promise<CategoryDocument> {
    const doc: Record<string, unknown> = {
      name: input.name,
      slug: input.slug,
      slugNormalized: input.slugNormalized,
      sortOrder: input.sortOrder ?? 0,
    };

    if (input.description !== undefined) doc.description = input.description;
    if (input.parentId !== undefined) doc.parentId = input.parentId;

    const created = await this.categoryModel.create(doc);
    return created as CategoryDocument;
  }

  update(id: CategoryId, input: UpdateCategoryInput): Promise<CategoryDocument | null> {
    const set: Record<string, unknown> = {};

    if (input.name !== undefined) set.name = input.name;
    if (input.description !== undefined) set.description = input.description;
    if (input.parentId !== undefined) set.parentId = input.parentId;
    if (input.sortOrder !== undefined) set.sortOrder = input.sortOrder;

    return this.categoryModel.findByIdAndUpdate(id, { $set: set }, { new: true }).exec();
  }

  softDelete(id: CategoryId): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findByIdAndUpdate(id, { $set: { deletedAt: new Date() } }, { new: true })
      .exec();
  }
}
