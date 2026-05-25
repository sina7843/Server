import type { SearchResultResponseDto } from '@dragon/types';
import type { SearchResult } from '../search.service';

export function toSearchResultResponse(result: SearchResult): SearchResultResponseDto {
  return {
    items: result.items,
    page: result.page,
    limit: result.limit,
    total: result.total,
  };
}
