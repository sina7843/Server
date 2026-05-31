import { Types } from 'mongoose';
import { EsportsService } from './esports.service';

function makePost(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    _id: 'post-id-1',
    type: 'article',
    title: 'Test Post',
    slug: 'test-post',
    slugNormalized: 'test-post',
    slugHistory: [],
    bodyHtml: '<p>content</p>',
    bodyJson: {},
    categoryIds: [],
    tagIds: [],
    mediaRefs: [],
    seo: {},
    status: 'published',
    viewCount: 10,
    publishedAt: new Date('2024-01-01T00:00:00.000Z'),
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

const FEATURED_TAG_ID = new Types.ObjectId();

function makeFeaturedTag(): Record<string, unknown> {
  return { _id: FEATURED_TAG_ID, slug: 'featured', slugNormalized: 'featured', name: 'Featured' };
}

describe('EsportsService', () => {
  let service: EsportsService;
  let postServiceMock: { list: jest.Mock; listTopPublished: jest.Mock };
  let tagRepositoryMock: { findBySlug: jest.Mock };

  beforeEach(() => {
    postServiceMock = {
      list: jest.fn(),
      listTopPublished: jest.fn(),
    };
    tagRepositoryMock = {
      findBySlug: jest.fn().mockResolvedValue(null),
    };
    service = new EsportsService(postServiceMock as never, tagRepositoryMock as never);
  });

  describe('getHome', () => {
    it('returns correct EsportsHomeDto shape', async () => {
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      const result = await service.getHome();

      expect(result).toHaveProperty('featuredPosts');
      expect(result).toHaveProperty('latestNews');
      expect(result).toHaveProperty('activeTournaments');
      expect(result).toHaveProperty('upcomingTournaments');
      expect(result).toHaveProperty('topContent');
    });

    it('returns empty activeTournaments while TournamentModule data is unavailable', async () => {
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      const result = await service.getHome();

      expect(result.activeTournaments).toEqual([]);
    });

    it('returns empty upcomingTournaments while TournamentModule data is unavailable', async () => {
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      const result = await service.getHome();

      expect(result.upcomingTournaments).toEqual([]);
    });

    it('returns empty arrays when no published content exists', async () => {
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      const result = await service.getHome();

      expect(result.featuredPosts).toEqual([]);
      expect(result.latestNews).toEqual([]);
      expect(result.topContent).toEqual([]);
    });

    it('featuredPosts is empty when featured tag does not exist', async () => {
      tagRepositoryMock.findBySlug.mockResolvedValue(null);
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      const result = await service.getHome();

      expect(result.featuredPosts).toEqual([]);
    });

    it('featuredPosts uses featured tag signal when tag exists', async () => {
      const tag = makeFeaturedTag();
      tagRepositoryMock.findBySlug.mockResolvedValue(tag);
      postServiceMock.list
        .mockResolvedValueOnce({ items: [makePost({ type: 'article' })], total: 1 })
        .mockResolvedValueOnce({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      const result = await service.getHome();

      const [firstCallFilter] = postServiceMock.list.mock.calls[0] as [Record<string, unknown>];
      expect(firstCallFilter).toMatchObject({
        status: 'published',
        includeDeleted: false,
        tagId: FEATURED_TAG_ID.toString(),
      });
      expect(result.featuredPosts).toHaveLength(1);
    });

    it('queries latestNews with type=news and status=published', async () => {
      tagRepositoryMock.findBySlug.mockResolvedValue(makeFeaturedTag());
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      await service.getHome();

      const newsCallFilter = postServiceMock.list.mock.calls[1] as [Record<string, unknown>];
      expect(newsCallFilter[0]).toMatchObject({
        type: 'news',
        status: 'published',
        includeDeleted: false,
      });
    });

    it('maps posts to PublicPostDto shape', async () => {
      const tag = makeFeaturedTag();
      tagRepositoryMock.findBySlug.mockResolvedValue(tag);
      const post = makePost({ type: 'article' });
      postServiceMock.list
        .mockResolvedValueOnce({ items: [post], total: 1 })
        .mockResolvedValueOnce({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      const result = await service.getHome();

      expect(result.featuredPosts[0]).toMatchObject({
        id: 'post-id-1',
        type: 'article',
        title: 'Test Post',
        slug: 'test-post',
      });
    });
  });
});
