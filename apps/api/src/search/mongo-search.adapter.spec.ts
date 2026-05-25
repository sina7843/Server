import { MongoSearchAdapter } from './mongo-search.adapter';

const VALID_OBJ_ID = '64f000000000000000000001';
const VALID_OBJ_ID_2 = '64f000000000000000000002';

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => VALID_OBJ_ID },
    type: 'news',
    title: 'Test News',
    excerpt: 'An excerpt',
    slug: 'test-news',
    status: 'published',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makePage(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => VALID_OBJ_ID_2 },
    title: 'Test Page',
    slug: 'test-page',
    status: 'published',
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
  };
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => VALID_OBJ_ID },
    phoneNormalized: '+989120000001',
    status: 'active',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeMedia(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => VALID_OBJ_ID },
    originalName: 'photo.jpg',
    mimeType: 'image/jpeg',
    status: 'ready',
    objectKey: 'private/internal/key',
    bucket: 'secret-bucket',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function buildQueryChain(resolveWith: unknown) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolveWith),
  };
  return chain;
}

function makeModels(
  posts: unknown[] = [makePost()],
  pages: unknown[] = [makePage()],
  users: unknown[] = [makeUser()],
  media: unknown[] = [makeMedia()],
) {
  const postModel = {
    find: jest.fn().mockReturnValue(buildQueryChain(posts)),
    countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(posts.length) }),
  };
  const pageModel = {
    find: jest.fn().mockReturnValue(buildQueryChain(pages)),
    countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(pages.length) }),
  };
  const userModel = {
    find: jest.fn().mockReturnValue(buildQueryChain(users)),
    countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(users.length) }),
  };
  const mediaModel = {
    find: jest.fn().mockReturnValue(buildQueryChain(media)),
    countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(media.length) }),
  };
  return { postModel, pageModel, userModel, mediaModel };
}

function makeAdapter(models = makeModels()) {
  return new MongoSearchAdapter(
    models.postModel as never,
    models.pageModel as never,
    models.userModel as never,
    models.mediaModel as never,
  );
}

describe('MongoSearchAdapter', () => {
  describe('searchPublicContent', () => {
    it('queries posts and pages when no type filter', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      const result = await adapter.searchPublicContent({ page: 1, limit: 20 });

      expect(models.postModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published', deletedAt: { $exists: false } }),
      );
      expect(models.pageModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published', deletedAt: { $exists: false } }),
      );
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('only queries posts when type is a post type', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      await adapter.searchPublicContent({ type: 'news', page: 1, limit: 20 });

      expect(models.postModel.find).toHaveBeenCalled();
      expect(models.pageModel.find).not.toHaveBeenCalled();
    });

    it('only queries pages when type is page', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      await adapter.searchPublicContent({ type: 'page', page: 1, limit: 20 });

      expect(models.postModel.find).not.toHaveBeenCalled();
      expect(models.pageModel.find).toHaveBeenCalled();
    });

    it('never includes draft or archived content', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      await adapter.searchPublicContent({ page: 1, limit: 20 });

      const postFilter = models.postModel.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(postFilter['status']).toBe('published');
    });

    it('never includes soft-deleted content', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      await adapter.searchPublicContent({ page: 1, limit: 20 });

      const postFilter = models.postModel.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(postFilter['deletedAt']).toEqual({ $exists: false });
    });

    it('news result has route /news/:slug', async () => {
      const models = makeModels([makePost({ type: 'news', slug: 'my-news' })]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchPublicContent({ type: 'news', page: 1, limit: 20 });

      expect(result.items[0]?.route).toBe('/news/my-news');
    });

    it('article result has route /articles/:slug', async () => {
      const models = makeModels([makePost({ type: 'article', slug: 'my-article' })]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchPublicContent({ type: 'article', page: 1, limit: 20 });

      expect(result.items[0]?.route).toBe('/articles/my-article');
    });

    it('page result has route /pages/:slug', async () => {
      const models = makeModels([], [makePage({ slug: 'about' })]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchPublicContent({ type: 'page', page: 1, limit: 20 });

      expect(result.items[0]?.route).toBe('/pages/about');
    });

    it('result items do not use /posts/:slug route', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      const result = await adapter.searchPublicContent({ page: 1, limit: 20 });

      for (const item of result.items) {
        expect(item.route).not.toMatch(/^\/posts\//);
      }
    });

    it('public results do not include status field', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      const result = await adapter.searchPublicContent({ page: 1, limit: 20 });

      for (const item of result.items) {
        expect(item.status).toBeUndefined();
      }
    });

    it('supports pagination', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      const result = await adapter.searchPublicContent({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe('searchAdminContent', () => {
    it('does not filter by status — includes draft and archived', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      await adapter.searchAdminContent({ page: 1, limit: 20 });

      const postFilter = models.postModel.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(postFilter['status']).toBeUndefined();
    });

    it('admin results include status field', async () => {
      const models = makeModels([makePost({ status: 'draft' })]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchAdminContent({ page: 1, limit: 20 });

      const postItem = result.items.find((i) => i.type === 'news');
      expect(postItem?.status).toBe('draft');
    });

    it('admin content results do not expose objectKey or bucket', async () => {
      const models = makeModels();
      const adapter = makeAdapter(models);

      const result = await adapter.searchAdminContent({ page: 1, limit: 20 });

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('objectKey');
      expect(serialized).not.toContain('bucket');
    });
  });

  describe('searchAdminUsers', () => {
    it('returns user results with masked phone as title', async () => {
      const models = makeModels([], [], [makeUser()]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchAdminUsers({ page: 1, limit: 20 });

      expect(result.items[0]?.type).toBe('user');
      expect(result.items[0]?.title).toMatch(/\*/);
    });

    it('does not expose passwordHash in results', async () => {
      const models = makeModels([], [], [makeUser()]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchAdminUsers({ page: 1, limit: 20 });

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('passwordHash');
    });

    it('does not expose phoneNormalized as title — uses masked phone', async () => {
      const user = makeUser({ phoneNormalized: '+989120000001' });
      const models = makeModels([], [], [user]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchAdminUsers({ page: 1, limit: 20 });

      expect(result.items[0]?.title).not.toBe('+989120000001');
    });

    it('excludes soft-deleted users', async () => {
      const models = makeModels([], [], [makeUser()]);
      const adapter = makeAdapter(models);

      await adapter.searchAdminUsers({ page: 1, limit: 20 });

      const filter = models.userModel.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(filter['deletedAt']).toEqual({ $exists: false });
    });

    it('supports pagination', async () => {
      const models = makeModels([], [], [makeUser()]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchAdminUsers({ page: 3, limit: 5 });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
    });
  });

  describe('searchAdminMedia', () => {
    it('returns media results with originalName as title', async () => {
      const models = makeModels([], [], [], [makeMedia()]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchAdminMedia({ page: 1, limit: 20 });

      expect(result.items[0]?.type).toBe('media');
      expect(result.items[0]?.title).toBe('photo.jpg');
    });

    it('does not expose objectKey or bucket in results', async () => {
      const models = makeModels([], [], [], [makeMedia()]);
      const adapter = makeAdapter(models);

      const result = await adapter.searchAdminMedia({ page: 1, limit: 20 });

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('objectKey');
      expect(serialized).not.toContain('bucket');
    });

    it('excludes soft-deleted media', async () => {
      const models = makeModels([], [], [], [makeMedia()]);
      const adapter = makeAdapter(models);

      await adapter.searchAdminMedia({ page: 1, limit: 20 });

      const filter = models.mediaModel.find.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(filter['deletedAt']).toEqual({ $exists: false });
    });
  });

  describe('reindex', () => {
    it('resolves without throwing — no-op for Phase 0 Mongo adapter', async () => {
      const adapter = makeAdapter();
      await expect(adapter.reindex()).resolves.toBeUndefined();
      await expect(adapter.reindex('content')).resolves.toBeUndefined();
    });
  });

  describe('SearchService interface', () => {
    it('MongoSearchAdapter implements SearchService', () => {
      const adapter = makeAdapter();
      expect(typeof adapter.searchPublicContent).toBe('function');
      expect(typeof adapter.searchAdminContent).toBe('function');
      expect(typeof adapter.searchAdminUsers).toBe('function');
      expect(typeof adapter.searchAdminMedia).toBe('function');
      expect(typeof adapter.reindex).toBe('function');
    });
  });
});
