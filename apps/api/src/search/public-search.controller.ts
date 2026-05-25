import { Controller, Get, Query } from '@nestjs/common';
import type { SearchResultResponseDto } from '@dragon/types';
import { SearchService } from './search.service';
import { parsePublicContentSearchQuery } from './dto/public-search-query';
import { toSearchResultResponse } from './dto/search-response';

@Controller('api/v1/search')
export class PublicSearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('content')
  async searchContent(@Query() query: unknown): Promise<SearchResultResponseDto> {
    const parsed = parsePublicContentSearchQuery(query);
    const result = await this.searchService.searchPublicContent(parsed);
    return toSearchResultResponse(result);
  }
}
