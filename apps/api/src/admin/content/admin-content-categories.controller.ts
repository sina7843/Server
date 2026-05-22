import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { PermissionGuard } from '../../rbac/guards/permission.guard';
import { Permissions } from '../../rbac/registry/permission-keys';
import { validateObjectId } from '../../rbac/dto/rbac-validation';
import { CategoryService } from '../../content/categories/category.service';
import {
  parseAdminCreateCategoryBody,
  parseAdminUpdateCategoryBody,
} from './dto/admin-category-body';
import {
  toAdminCategoryListResponse,
  toAdminCategoryResponse,
} from './dto/admin-category-response';
import type {
  AdminCategoryListResponse,
  AdminCategoryResponse,
  ContentGenericResponse,
} from '@dragon/types';

@Controller('admin/v1/content/categories')
@UseGuards(AccessTokenGuard, PermissionGuard)
export class AdminContentCategoriesController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @RequirePermission(Permissions.CONTENT_CATEGORY_READ)
  async listCategories(): Promise<AdminCategoryListResponse> {
    const cats = await this.categoryService.list(true);
    return toAdminCategoryListResponse(cats);
  }

  @Post()
  @RequirePermission(Permissions.CONTENT_CATEGORY_CREATE)
  async createCategory(@Body() body: unknown): Promise<AdminCategoryResponse> {
    const input = parseAdminCreateCategoryBody(body);
    const cat = await this.categoryService.create({
      name: input.name,
      slug: input.slug,
      slugNormalized: input.slug,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      sortOrder: input.sortOrder,
    });
    return toAdminCategoryResponse(cat);
  }

  @Patch(':id')
  @RequirePermission(Permissions.CONTENT_CATEGORY_UPDATE)
  async updateCategory(
    @Param('id') rawId: string,
    @Body() body: unknown,
  ): Promise<AdminCategoryResponse> {
    const id = validateObjectId(rawId, 'id');
    const input = parseAdminUpdateCategoryBody(body);
    const updated = await this.categoryService.update(id, input);
    if (!updated) {
      throw new NotFoundException('Category not found.');
    }
    return toAdminCategoryResponse(updated);
  }

  @Delete(':id')
  @RequirePermission(Permissions.CONTENT_CATEGORY_DELETE)
  async deleteCategory(@Param('id') rawId: string): Promise<ContentGenericResponse> {
    const id = validateObjectId(rawId, 'id');
    await this.categoryService.softDelete(id);
    return { success: true, message: 'Category deleted.' };
  }
}
