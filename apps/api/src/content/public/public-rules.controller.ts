import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicPostsService, parsePublicListQuery } from './public-posts.service';
import { toPublicPostListResponse, toPublicPostResponse } from './dto/public-post-response';
import type { PublicPostListResponse, PublicPostResponse } from '@dragon/types';

@Controller('api/v1/rules')
export class PublicRulesController {
  constructor(private readonly service: PublicPostsService) {}

  @Get()
  async listRules(@Query() query: unknown): Promise<PublicPostListResponse> {
    const q = parsePublicListQuery(query);
    const { items, total, page, limit } = await this.service.listPublished('rule', q);
    return toPublicPostListResponse(items, total, page, limit);
  }

  @Get(':slug')
  async getRule(@Param('slug') slug: string): Promise<PublicPostResponse> {
    const post = await this.service.getPublished('rule', slug);
    return toPublicPostResponse(post);
  }
}
