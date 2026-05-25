import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Optional,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuditAction } from '@dragon/types';
import { AuditService } from '../../audit/audit.service';
import { AccessTokenGuard } from '../../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../../auth/guards/authenticated-request';
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
  constructor(
    private readonly categoryService: CategoryService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  @Get()
  @RequirePermission(Permissions.CONTENT_CATEGORY_READ)
  async listCategories(): Promise<AdminCategoryListResponse> {
    const cats = await this.categoryService.list(true);
    return toAdminCategoryListResponse(cats);
  }

  @Post()
  @RequirePermission(Permissions.CONTENT_CATEGORY_CREATE)
  async createCategory(
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminCategoryResponse> {
    const input = parseAdminCreateCategoryBody(body);
    const cat = await this.categoryService.create({
      name: input.name,
      slug: input.slug,
      slugNormalized: input.slug,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      sortOrder: input.sortOrder,
    });
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.CONTENT_CATEGORY_CREATED,
      resourceType: 'content_category',
      resourceId: String(cat._id),
      after: { name: cat.name, slug: cat.slug },
      severity: 'info',
    });
    return toAdminCategoryResponse(cat);
  }

  @Patch(':id')
  @RequirePermission(Permissions.CONTENT_CATEGORY_UPDATE)
  async updateCategory(
    @Param('id') rawId: string,
    @Body() body: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<AdminCategoryResponse> {
    const id = validateObjectId(rawId, 'id');
    const input = parseAdminUpdateCategoryBody(body);
    const updated = await this.categoryService.update(id, input);
    if (!updated) {
      throw new NotFoundException('Category not found.');
    }
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.CONTENT_CATEGORY_UPDATED,
      resourceType: 'content_category',
      resourceId: id,
      after: { name: updated.name, slug: updated.slug },
      severity: 'info',
    });
    return toAdminCategoryResponse(updated);
  }

  @Delete(':id')
  @RequirePermission(Permissions.CONTENT_CATEGORY_DELETE)
  async deleteCategory(
    @Param('id') rawId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ContentGenericResponse> {
    const id = validateObjectId(rawId, 'id');
    await this.categoryService.softDelete(id);
    void this.auditService?.log({
      ...(req.auth?.userId !== undefined ? { actorId: req.auth.userId } : {}),
      actorType: 'admin',
      action: AuditAction.CONTENT_CATEGORY_DELETED,
      resourceType: 'content_category',
      resourceId: id,
      severity: 'warning',
    });
    return { success: true, message: 'Category deleted.' };
  }
}
