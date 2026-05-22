import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CategoryService } from '../categories/category.service';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import {
  toPublicCategoryListResponse,
  toPublicCategoryResponse,
} from './dto/public-category-response';
import type { PublicCategoryListResponse, PublicCategoryResponse } from '@dragon/types';

@Controller('api/v1/categories')
export class PublicCategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async listCategories(): Promise<PublicCategoryListResponse> {
    const items = await this.categoryService.list(false);
    return toPublicCategoryListResponse(items);
  }

  @Get(':slug')
  async getCategory(@Param('slug') slug: string): Promise<PublicCategoryResponse> {
    let slugNormalized: string;
    try {
      slugNormalized = normalizeSlug(slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new NotFoundException('Category not found.');
      }
      throw err;
    }

    const cat = await this.categoryService.findBySlug(slugNormalized);
    if (!cat) throw new NotFoundException('Category not found.');
    return toPublicCategoryResponse(cat);
  }
}
