import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PageService } from '../pages/page.service';
import { normalizeSlug, SlugPolicyError } from '../slug/slug-policy';
import { toPublicPageResponse } from './dto/public-page-response';
import type { PublicPageResponse } from '@dragon/types';

@Controller('api/v1/pages')
export class PublicPagesController {
  constructor(private readonly pageService: PageService) {}

  @Get(':slug')
  async getPage(@Param('slug') slug: string): Promise<PublicPageResponse> {
    let slugNormalized: string;
    try {
      slugNormalized = normalizeSlug(slug);
    } catch (err) {
      if (err instanceof SlugPolicyError) {
        throw new NotFoundException('Page not found.');
      }
      throw err;
    }

    const page = await this.pageService.findPublishedBySlug(slugNormalized);
    if (!page) throw new NotFoundException('Page not found.');
    return toPublicPageResponse(page);
  }
}
