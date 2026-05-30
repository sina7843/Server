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

describe('EsportsService', () => {
  let service: EsportsService;
  let postServiceMock: { list: jest.Mock; listTopPublished: jest.Mock };

  beforeEach(() => {
    postServiceMock = {
      list: jest.fn(),
      listTopPublished: jest.fn(),
    };
    service = new EsportsService(postServiceMock as never);
  });

  describe('getHome', () => {
    it('returns correct EsportsHomeDto shape', async () => {
      postServiceMock.list
        .mockResolvedValueOnce({ items: [makePost({ type: 'article' })], total: 1 })
        .mockResolvedValueOnce({ items: [makePost({ _id: 'post-id-2', type: 'news' })], total: 1 });
      postServiceMock.listTopPublished.mockResolvedValue([
        makePost({ _id: 'post-id-3', viewCount: 100 }),
      ]);

      const result = await service.getHome();

      expect(result).toHaveProperty('featuredPosts');
      expect(result).toHaveProperty('latestNews');
      expect(result).toHaveProperty('activeTournaments');
      expect(result).toHaveProperty('upcomingTournaments');
      expect(result).toHaveProperty('topContent');
    });

    it('activeTournaments is always an empty array', async () => {
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      const result = await service.getHome();

      expect(result.activeTournaments).toEqual([]);
    });

    it('upcomingTournaments is always an empty array', async () => {
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

    it('queries featuredPosts with type=article and status=published', async () => {
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      await service.getHome();

      const [firstCallFilter] = postServiceMock.list.mock.calls[0] as [Record<string, unknown>];
      expect(firstCallFilter).toMatchObject({
        type: 'article',
        status: 'published',
        includeDeleted: false,
      });
    });

    it('queries latestNews with type=news and status=published', async () => {
      postServiceMock.list.mockResolvedValue({ items: [], total: 0 });
      postServiceMock.listTopPublished.mockResolvedValue([]);

      await service.getHome();

      const [secondCallFilter] = postServiceMock.list.mock.calls[1] as [Record<string, unknown>];
      expect(secondCallFilter).toMatchObject({
        type: 'news',
        status: 'published',
        includeDeleted: false,
      });
    });

    it('maps posts to PublicPostDto shape', async () => {
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
