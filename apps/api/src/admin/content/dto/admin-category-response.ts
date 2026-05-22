import type { CategoryDocument } from '../../../content/categories/category.schema';
import type {
  AdminCategoryDto,
  AdminCategoryListResponse,
  AdminCategoryResponse,
} from '@dragon/types';

export function toAdminCategoryDto(cat: CategoryDocument): AdminCategoryDto {
  return {
    id: String(cat._id),
    name: cat.name,
    slug: cat.slug,
    slugNormalized: cat.slugNormalized,
    ...(cat.description ? { description: cat.description } : {}),
    ...(cat.parentId ? { parentId: String(cat.parentId) } : {}),
    sortOrder: cat.sortOrder,
    ...(cat.deletedAt ? { deletedAt: cat.deletedAt.toISOString() } : {}),
    createdAt: cat.createdAt.toISOString(),
    updatedAt: cat.updatedAt.toISOString(),
  };
}

export function toAdminCategoryListResponse(items: CategoryDocument[]): AdminCategoryListResponse {
  return { items: items.map(toAdminCategoryDto) };
}

export function toAdminCategoryResponse(cat: CategoryDocument): AdminCategoryResponse {
  return { category: toAdminCategoryDto(cat) };
}
