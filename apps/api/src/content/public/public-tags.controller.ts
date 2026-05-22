import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { TagService } from '../tags/tag.service';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import { toPublicTagListResponse, toPublicTagResponse } from './dto/public-tag-response';
import type { PublicTagListResponse, PublicTagResponse } from '@dragon/types';

@Controller('api/v1/tags')
export class PublicTagsController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  async listTags(): Promise<PublicTagListResponse> {
    const items = await this.tagService.list(false);
    return toPublicTagListResponse(items);
  }

  @Get(':slug')
  async getTag(@Param('slug') slug: string): Promise<PublicTagResponse> {
    let slugNormalized: string;
    try {
      slugNormalized = normalizeSlug(slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new NotFoundException('Tag not found.');
      }
      throw err;
    }

    const tag = await this.tagService.findBySlug(slugNormalized);
    if (!tag) throw new NotFoundException('Tag not found.');
    return toPublicTagResponse(tag);
  }
}
