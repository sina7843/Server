import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicPostsService, parsePublicListQuery } from './public-posts.service';
import { toPublicPostListResponse, toPublicPostResponse } from './dto/public-post-response';
import type { PublicPostListResponse, PublicPostResponse } from '@dragon/types';

@Controller('api/v1/articles')
export class PublicArticlesController {
  constructor(private readonly service: PublicPostsService) {}

  @Get()
  async listArticles(@Query() query: unknown): Promise<PublicPostListResponse> {
    const q = parsePublicListQuery(query);
    const { items, total, page, limit } = await this.service.listPublished('article', q);
    return toPublicPostListResponse(items, total, page, limit);
  }

  @Get(':slug')
  async getArticle(@Param('slug') slug: string): Promise<PublicPostResponse> {
    const post = await this.service.getPublished('article', slug);
    return toPublicPostResponse(post);
  }
}
