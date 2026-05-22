import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicPostsService, parsePublicListQuery } from './public-posts.service';
import { toPublicPostListResponse, toPublicPostResponse } from './dto/public-post-response';
import type { PublicPostListResponse, PublicPostResponse } from '@dragon/types';

@Controller('api/v1/announcements')
export class PublicAnnouncementsController {
  constructor(private readonly service: PublicPostsService) {}

  @Get()
  async listAnnouncements(@Query() query: unknown): Promise<PublicPostListResponse> {
    const q = parsePublicListQuery(query);
    const { items, total, page, limit } = await this.service.listPublished('announcement', q);
    return toPublicPostListResponse(items, total, page, limit);
  }

  @Get(':slug')
  async getAnnouncement(@Param('slug') slug: string): Promise<PublicPostResponse> {
    const post = await this.service.getPublished('announcement', slug);
    return toPublicPostResponse(post);
  }
}
