import { BadRequestException } from '@nestjs/common';
import { AdminSearchController } from './admin-search.controller';
import { parseAdminSearchQuery } from './dto/admin-search-query';

const VALID_ID = '64f000000000000000000001';

const mockUsersResult = {
  items: [
    {
      id: VALID_ID,
      type: 'user',
      title: '+98***0001',
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
};

const mockContentResult = {
  items: [
    {
      id: VALID_ID,
      type: 'news',
      title: 'Admin News',
      slug: 'admin-news',
      route: '/news/admin-news',
      status: 'draft',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
};

const mockMediaResult = {
  items: [
    {
      id: VALID_ID,
      type: 'media',
      title: 'photo.jpg',
      status: 'ready',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
};

function createController() {
  const service = {
    searchPublicContent: jest.fn(),
    searchAdminContent: jest.fn().mockResolvedValue(mockContentResult),
    searchAdminUsers: jest.fn().mockResolvedValue(mockUsersResult),
    searchAdminMedia: jest.fn().mockResolvedValue(mockMediaResult),
    reindex: jest.fn().mockResolvedValue(undefined),
  };
  const queue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
  return {
    service,
    queue,
    controller: new AdminSearchController(service as never, queue as never),
  };
}

describe('AdminSearchController', () => {
  describe('GET /admin/v1/search/users', () => {
    it('returns user search results', async () => {
      const { controller, service } = createController();
      const result = await controller.searchUsers({});

      expect(service.searchAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.type).toBe('user');
    });

    it('passes q to service', async () => {
      const { controller, service } = createController();
      await controller.searchUsers({ q: '+989120000000' });

      expect(service.searchAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ q: '+989120000000' }),
      );
    });

    it('user results do not contain passwordHash or tokens', async () => {
      const { controller } = createController();
      const result = await controller.searchUsers({});

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('refreshToken');
      expect(serialized).not.toContain('accessToken');
      expect(serialized).not.toContain('phoneNormalized');
    });

    it('user title is masked phone, not raw phone', async () => {
      const { controller } = createController();
      const result = await controller.searchUsers({});

      // Masked phone contains *** pattern
      expect(result.items[0]?.title).toMatch(/\*/);
    });
  });

  describe('GET /admin/v1/search/content', () => {
    it('returns content search results including status', async () => {
      const { controller } = createController();
      const result = await controller.searchContent({});

      expect(result.items[0]?.status).toBeDefined();
    });

    it('content results contain type-specific routes', async () => {
      const { controller } = createController();
      const result = await controller.searchContent({});

      for (const item of result.items) {
        if (item.route) {
          expect(item.route).not.toMatch(/^\/posts\//);
        }
      }
    });

    it('admin content results do not expose internal storage secrets', async () => {
      const { controller } = createController();
      const result = await controller.searchContent({});

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('objectKey');
      expect(serialized).not.toContain('bucket');
      expect(serialized).not.toContain('passwordHash');
    });
  });

  describe('GET /admin/v1/search/media', () => {
    it('returns media search results', async () => {
      const { controller } = createController();
      const result = await controller.searchMedia({});

      expect(result.items[0]?.type).toBe('media');
    });

    it('media results do not expose storage secrets', async () => {
      const { controller } = createController();
      const result = await controller.searchMedia({});

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('objectKey');
      expect(serialized).not.toContain('bucket');
      expect(serialized).not.toContain('storageProvider');
    });
  });

  describe('POST /admin/v1/search/reindex', () => {
    it('queues a reindex job and returns queued: true', async () => {
      const { controller, queue } = createController();
      const result = await controller.reindex({});

      expect(queue.add).toHaveBeenCalledWith(
        'search.reindex_all',
        expect.any(Object),
        expect.any(Object),
      );
      expect(result.queued).toBe(true);
      expect(result.message).toBeTruthy();
    });

    it('passes scope when provided', async () => {
      const { controller, queue } = createController();
      const result = await controller.reindex({ scope: 'content' });

      expect(queue.add).toHaveBeenCalledWith(
        'search.reindex_all',
        expect.objectContaining({ scope: 'content' }),
        expect.any(Object),
      );
      expect(result.scope).toBe('content');
    });

    it('ignores invalid scope value', async () => {
      const { controller } = createController();
      const result = await controller.reindex({ scope: 'invalid_scope' });

      expect('scope' in result).toBe(false);
    });

    it('does not require Meilisearch or external search engine', async () => {
      const { controller } = createController();
      const result = await controller.reindex({});

      expect(result.queued).toBe(true);
    });
  });
});

describe('parseAdminSearchQuery', () => {
  it('returns default page and limit', () => {
    const result = parseAdminSearchQuery({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('parses q parameter', () => {
    const result = parseAdminSearchQuery({ q: 'hello' });
    expect(result.q).toBe('hello');
  });

  it('rejects limit above 50', () => {
    expect(() => parseAdminSearchQuery({ limit: '100' })).toThrow(BadRequestException);
  });

  it('rejects page below 1', () => {
    expect(() => parseAdminSearchQuery({ page: '0' })).toThrow(BadRequestException);
  });

  it('rejects q longer than 200 chars', () => {
    expect(() => parseAdminSearchQuery({ q: 'x'.repeat(201) })).toThrow(BadRequestException);
  });

  it('omits q when not provided', () => {
    const result = parseAdminSearchQuery({});
    expect('q' in result).toBe(false);
  });
});
