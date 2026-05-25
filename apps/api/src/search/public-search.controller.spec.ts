import { BadRequestException } from '@nestjs/common';
import { PublicSearchController } from './public-search.controller';
import { parsePublicContentSearchQuery } from './dto/public-search-query';

const mockResult = {
  items: [
    {
      id: '64f000000000000000000001',
      type: 'news',
      title: 'Test Article',
      slug: 'test-article',
      route: '/news/test-article',
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
    searchPublicContent: jest.fn().mockResolvedValue(mockResult),
    searchAdminContent: jest.fn(),
    searchAdminUsers: jest.fn(),
    searchAdminMedia: jest.fn(),
    reindex: jest.fn(),
  };
  return { service, controller: new PublicSearchController(service as never) };
}

describe('PublicSearchController', () => {
  describe('GET /api/v1/search/content', () => {
    it('returns search results with default pagination', async () => {
      const { controller, service } = createController();
      const result = await controller.searchContent({});

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(1);
    });

    it('passes q parameter', async () => {
      const { controller, service } = createController();
      await controller.searchContent({ q: 'football' });

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'football' }),
      );
    });

    it('passes type filter', async () => {
      const { controller, service } = createController();
      await controller.searchContent({ type: 'news' });

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'news' }),
      );
    });

    it('accepts page type filter', async () => {
      const { controller, service } = createController();
      await controller.searchContent({ type: 'page' });

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'page' }),
      );
    });

    it('passes pagination parameters', async () => {
      const { controller, service } = createController();
      await controller.searchContent({ page: '2', limit: '10' });

      expect(service.searchPublicContent).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      );
    });

    it('result routes are type-specific — no generic /posts/:slug', async () => {
      const { controller } = createController();
      const result = await controller.searchContent({});

      for (const item of result.items) {
        expect(item.route).not.toMatch(/^\/posts\//);
      }
    });

    it('result route for news uses /news/:slug', () => {
      expect(mockResult.items[0]?.route).toBe('/news/test-article');
    });
  });
});

describe('parsePublicContentSearchQuery', () => {
  it('validates valid type values', () => {
    const types = ['news', 'article', 'announcement', 'guide', 'rule', 'page'];
    for (const type of types) {
      expect(() => parsePublicContentSearchQuery({ type })).not.toThrow();
    }
  });

  it('rejects invalid type', () => {
    expect(() => parsePublicContentSearchQuery({ type: 'blog' })).toThrow(BadRequestException);
  });

  it('rejects invalid categoryId', () => {
    expect(() => parsePublicContentSearchQuery({ categoryId: 'not-valid' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects invalid tagId', () => {
    expect(() => parsePublicContentSearchQuery({ tagId: 'not-valid' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects limit above max', () => {
    expect(() => parsePublicContentSearchQuery({ limit: '100' })).toThrow(BadRequestException);
  });

  it('rejects page below 1', () => {
    expect(() => parsePublicContentSearchQuery({ page: '0' })).toThrow(BadRequestException);
  });

  it('rejects q longer than 200 chars', () => {
    expect(() => parsePublicContentSearchQuery({ q: 'a'.repeat(201) })).toThrow(
      BadRequestException,
    );
  });

  it('returns default page and limit when not provided', () => {
    const result = parsePublicContentSearchQuery({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('omits undefined optional fields', () => {
    const result = parsePublicContentSearchQuery({ page: '1' });
    expect('q' in result).toBe(false);
    expect('type' in result).toBe(false);
    expect('categoryId' in result).toBe(false);
    expect('tagId' in result).toBe(false);
  });
});
