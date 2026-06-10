import { Inject, Injectable, Optional } from '@nestjs/common';
import type { EsportsHomeDto, TournamentListItemDto } from '@dragon/types';
import type { Types } from 'mongoose';
import { PostService } from '../content/posts/post.service';
import { TagRepository } from '../content/tags/tag.repository';
import { toPublicPostDto } from '../content/public/dto/public-post-response';
import { TournamentRepository } from '../tournaments/tournament.repository';
import type { TournamentDocument } from '../tournaments/tournament.schema';
import { MediaAssetRepository } from '../media/media-asset.repository';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.service';
import type { PostDocument } from '../content/posts/post.schema';

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
    @Optional() @Inject(MediaAssetRepository) private readonly mediaAssetRepository?: MediaAssetRepository,
    @Optional() @Inject(STORAGE_SERVICE) private readonly storageService?: StorageService,
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

    const allPosts = [
      ...featuredResult.items,
      ...latestNewsResult.items,
      ...topPostDocs,
    ];

    const coverMap = await this.resolveCoverUrls(allPosts);

    return {
      featuredPosts: featuredResult.items.map((p) => { const url = coverMap.get(String(p._id)); return toPublicPostDto(p, url ? { coverImageUrl: url } : {}); }),
      latestNews: latestNewsResult.items.map((p) => { const url = coverMap.get(String(p._id)); return toPublicPostDto(p, url ? { coverImageUrl: url } : {}); }),
      activeTournaments: activeTournamentsResult.items.map(toTournamentListItemDto),
      upcomingTournaments: upcomingTournamentsResult.items.map(toTournamentListItemDto),
      topContent: topPostDocs.map((p) => { const url = coverMap.get(String(p._id)); return toPublicPostDto(p, url ? { coverImageUrl: url } : {}); }),
    };
  }

  private async resolveCoverUrls(posts: PostDocument[]): Promise<Map<string, string>> {
    const empty = new Map<string, string>();
    if (!this.mediaAssetRepository || !this.storageService) return empty;

    const coverIds = posts
      .filter((p) => p.coverMediaId)
      .map((p) => p.coverMediaId as Types.ObjectId);

    if (!coverIds.length) return empty;

    const assets = await this.mediaAssetRepository.findManyByIds(coverIds).catch(() => []);
    const assetById = new Map(assets.map((a) => [String(a._id), this.storageService!.getPublicUrl(a.objectKey)]));

    const postCoverMap = new Map<string, string>();
    for (const post of posts) {
      if (post.coverMediaId) {
        const url = assetById.get(String(post.coverMediaId));
        if (url) postCoverMap.set(String(post._id), url);
      }
    }
    return postCoverMap;
  }
}
