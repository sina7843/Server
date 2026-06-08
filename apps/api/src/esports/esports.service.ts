import { Injectable } from '@nestjs/common';
import type { EsportsHomeDto, TournamentListItemDto } from '@dragon/types';
import { PostService } from '../content/posts/post.service';
import { TagRepository } from '../content/tags/tag.repository';
import { toPublicPostDto } from '../content/public/dto/public-post-response';
import { TournamentRepository } from '../tournaments/tournament.repository';
import type { TournamentDocument } from '../tournaments/tournament.schema';

const HOME_FEATURED_LIMIT = 5;
const HOME_NEWS_LIMIT = 5;
const HOME_TOP_CONTENT_LIMIT = 6;
const HOME_ACTIVE_TOURNAMENT_LIMIT = 4;
const HOME_UPCOMING_TOURNAMENT_LIMIT = 4;

function toTournamentListItemDto(t: TournamentDocument): TournamentListItemDto {
  return {
    id: String(t._id),
    gameId: String(t.gameId),
    title: t.title,
    slug: t.slug,
    format: t.format,
    status: t.status,
    capacity: t.capacity,
    ...(t.startsAt !== undefined ? { startsAt: t.startsAt.toISOString() } : {}),
    ...(t.publishedAt !== undefined ? { publishedAt: t.publishedAt.toISOString() } : {}),
  };
}

@Injectable()
export class EsportsService {
  constructor(
    private readonly postService: PostService,
    private readonly tagRepository: TagRepository,
    private readonly tournamentRepository: TournamentRepository,
  ) {}

  async getHome(): Promise<EsportsHomeDto> {
    const featuredTag = await this.tagRepository.findBySlug('featured');

    const [featuredResult, latestNewsResult, topPostDocs, activeTournamentsResult, upcomingTournamentsResult] =
      await Promise.all([
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
        this.tournamentRepository.list(
          { statuses: ['in_progress'], includeDeleted: false, includeArchived: false },
          1,
          HOME_ACTIVE_TOURNAMENT_LIMIT,
        ),
        this.tournamentRepository.list(
          { statuses: ['registration_open', 'published'], includeDeleted: false, includeArchived: false },
          1,
          HOME_UPCOMING_TOURNAMENT_LIMIT,
        ),
      ]);

    return {
      featuredPosts: featuredResult.items.map((p) => toPublicPostDto(p)),
      latestNews: latestNewsResult.items.map((p) => toPublicPostDto(p)),
      activeTournaments: activeTournamentsResult.items.map(toTournamentListItemDto),
      upcomingTournaments: upcomingTournamentsResult.items.map(toTournamentListItemDto),
      topContent: topPostDocs.map((p) => toPublicPostDto(p)),
    };
  }
}
