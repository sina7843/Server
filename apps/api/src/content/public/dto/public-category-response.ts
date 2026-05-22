import type { CategoryDocument } from '../../categories/category.schema';
import type {
  PublicCategoryDto,
  PublicCategoryListResponse,
  PublicCategoryResponse,
} from '@dragon/types';

export function toPublicCategoryDto(cat: CategoryDocument): PublicCategoryDto {
  return {
    id: String(cat._id),
    name: cat.name,
    slug: cat.slug,
    ...(cat.description ? { description: cat.description } : {}),
    ...(cat.parentId ? { parentId: String(cat.parentId) } : {}),
    sortOrder: cat.sortOrder,
  };
}

export function toPublicCategoryListResponse(
  items: CategoryDocument[],
): PublicCategoryListResponse {
  return { items: items.map(toPublicCategoryDto) };
}

export function toPublicCategoryResponse(cat: CategoryDocument): PublicCategoryResponse {
  return { category: toPublicCategoryDto(cat) };
}
