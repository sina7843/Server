import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import { CategoryRepository } from './category.repository';
import type { CategoryDocument } from './category.schema';
import type { CategoryId, CreateCategoryInput, UpdateCategoryInput } from './category.types';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  findById(id: CategoryId): Promise<CategoryDocument | null> {
    return this.categoryRepository.findById(id);
  }

  findBySlug(slugNormalized: string): Promise<CategoryDocument | null> {
    return this.categoryRepository.findBySlug(slugNormalized);
  }

  list(includeDeleted = false): Promise<CategoryDocument[]> {
    return this.categoryRepository.list(includeDeleted);
  }

  async isSlugTaken(slugNormalized: string, excludeId?: CategoryId): Promise<boolean> {
    const existing = await this.categoryRepository.existsBySlug(slugNormalized, excludeId);
    return existing !== null;
  }

  async create(input: CreateCategoryInput): Promise<CategoryDocument> {
    let slugNormalized: string;

    try {
      slugNormalized = normalizeSlug(input.slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new ConflictException(err.message);
      }
      throw err;
    }

    const taken = await this.isSlugTaken(slugNormalized);
    if (taken) {
      throw new ConflictException(`Category slug "${input.slug}" is already taken.`);
    }

    return this.categoryRepository.create({ ...input, slugNormalized });
  }

  update(id: CategoryId, input: UpdateCategoryInput): Promise<CategoryDocument | null> {
    return this.categoryRepository.update(id, input);
  }

  async softDelete(id: CategoryId): Promise<CategoryDocument> {
    const updated = await this.categoryRepository.softDelete(id);
    if (!updated) {
      throw new NotFoundException('Category not found.');
    }
    return updated;
  }
}
