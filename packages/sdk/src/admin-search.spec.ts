import { createAdminSearchClient } from './admin-search';

function createMockClient() {
  const request = jest.fn();
  const client = createAdminSearchClient({ request } as never);
  return { request, client };
}

const emptyResult = { items: [], page: 1, limit: 20, total: 0 };

describe('createAdminSearchClient', () => {
  describe('searchUsers', () => {
    it('calls GET /admin/v1/search/users with no params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchUsers();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/search/users' }),
      );
    });

    it('passes q parameter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchUsers({ q: '+98912' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/admin/v1/search/users?q=%2B98912' }),
      );
    });

    it('passes pagination', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchUsers({ page: 2, limit: 10 });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('page=2');
      expect(callArg.path).toContain('limit=10');
    });
  });

  describe('searchContent', () => {
    it('calls GET /admin/v1/search/content', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchContent();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/search/content' }),
      );
    });

    it('passes q parameter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchContent({ q: 'dragon' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/admin/v1/search/content?q=dragon' }),
      );
    });
  });

  describe('searchMedia', () => {
    it('calls GET /admin/v1/search/media', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchMedia();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/search/media' }),
      );
    });
  });

  describe('reindex', () => {
    it('calls POST /admin/v1/search/reindex with empty body', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ queued: true, message: 'ok' });
      await client.reindex();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'POST', path: '/admin/v1/search/reindex' }),
      );
    });

    it('passes scope when provided', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ queued: true, message: 'ok', scope: 'content' });
      await client.reindex({ scope: 'content' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          body: JSON.stringify({ scope: 'content' }),
        }),
      );
    });

    it('has no Meilisearch-specific method', () => {
      const { client } = createMockClient();
      expect('configureMeilisearch' in client).toBe(false);
    });

    it('has no analytics method', () => {
      const { client } = createMockClient();
      expect('getSearchAnalytics' in client).toBe(false);
    });
  });

  describe('SDK DTOs do not expose DB entity types', () => {
    it('search result items match SearchResultItemDto shape', async () => {
      const { request, client } = createMockClient();
      const mockItem = {
        id: '64f000000000000000000001',
        type: 'news',
        title: 'Test',
        slug: 'test',
        route: '/news/test',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      request.mockResolvedValue({ items: [mockItem], page: 1, limit: 20, total: 1 });
      const result = await client.searchContent({ q: 'test' });
      expect(result.items[0]?.id).toBe('64f000000000000000000001');
      expect(result.items[0]).not.toHaveProperty('_id');
      expect(result.items[0]).not.toHaveProperty('passwordHash');
    });
  });
});
