import { Injectable } from '@nestjs/common';
import type { EsportsHomeDto } from '@dragon/types';
import { PostService } from '../content/posts/post.service';
import { toPublicPostDto } from '../content/public/dto/public-post-response';

const HOME_FEATURED_LIMIT = 5;
const HOME_NEWS_LIMIT = 5;
const HOME_TOP_CONTENT_LIMIT = 5;

@Injectable()
export class EsportsService {
  constructor(private readonly postService: PostService) {}

  async getHome(): Promise<EsportsHomeDto> {
    const [featuredResult, latestNewsResult, topPostDocs] = await Promise.all([
      this.postService.list(
        { type: 'article', status: 'published', includeDeleted: false },
        1,
        HOME_FEATURED_LIMIT,
      ),
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
