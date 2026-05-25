import { createSearchClient } from './search';

function createMockClient() {
  const request = jest.fn();
  const client = createSearchClient({ request } as never);
  return { request, client };
}

const emptyResult = { items: [], page: 1, limit: 20, total: 0 };

describe('createSearchClient', () => {
  describe('searchContent', () => {
    it('calls GET /api/v1/search/content with no params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchContent();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/api/v1/search/content' }),
      );
    });

    it('passes q parameter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchContent({ q: 'football' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/v1/search/content?q=football' }),
      );
    });

    it('passes type filter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchContent({ type: 'news' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/v1/search/content?type=news' }),
      );
    });

    it('passes page and limit', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchContent({ page: 2, limit: 10 });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('page=2');
      expect(callArg.path).toContain('limit=10');
    });

    it('passes categoryId', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyResult);
      await client.searchContent({ categoryId: '64f000000000000000000001' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/search/content?categoryId=64f000000000000000000001',
        }),
      );
    });

    it('has no Meilisearch-specific method', () => {
      const { client } = createMockClient();
      expect('configMeilisearch' in client).toBe(false);
      expect('setMeilisearchIndex' in client).toBe(false);
    });

    it('has no analytics method', () => {
      const { client } = createMockClient();
      expect('getAnalytics' in client).toBe(false);
      expect('trackEvent' in client).toBe(false);
    });
  });
});
