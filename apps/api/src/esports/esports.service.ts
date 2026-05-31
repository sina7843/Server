import { Injectable } from '@nestjs/common';
import type { EsportsHomeDto } from '@dragon/types';
import { PostService } from '../content/posts/post.service';
import { TagRepository } from '../content/tags/tag.repository';
import { toPublicPostDto } from '../content/public/dto/public-post-response';

const HOME_FEATURED_LIMIT = 5;
const HOME_NEWS_LIMIT = 5;
const HOME_TOP_CONTENT_LIMIT = 5;

@Injectable()
export class EsportsService {
  constructor(
    private readonly postService: PostService,
    private readonly tagRepository: TagRepository,
  ) {}

  async getHome(): Promise<EsportsHomeDto> {
    const featuredTag = await this.tagRepository.findBySlug('featured');

    const [featuredResult, latestNewsResult, topPostDocs] = await Promise.all([
      featuredTag
        ? this.postService.list(
            { status: 'published', includeDeleted: false, tagId: featuredTag._id.toString() },
            1,
            HOME_FEATURED_LIMIT,
          )
        : Promise.resolve({ items: [], total: 0 }),
      this.postService.list(
        { type: 'news', status: 'published', includeDeleted: false },
        1,
        HOME_NEWS_LIMIT,
      ),
      this.postService.listTopPublished(HOME_TOP_CONTENT_LIMIT),
    ]);

    return {
      featuredPosts: featuredResult.items.map(toPublicPostDto),
      latestNews: latestNewsResult.items.map(toPublicPostDto),
      activeTournaments: [],
      upcomingTournaments: [],
      topContent: topPostDocs.map(toPublicPostDto),
    };
  }
}
