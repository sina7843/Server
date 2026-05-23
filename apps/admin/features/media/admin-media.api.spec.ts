import { ApiClientError, createAdminMediaClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

const ASSET_ID = '64f000000000000000000001';

const mockAsset = {
  id: ASSET_ID,
  originalName: 'photo.jpg',
  mimeType: 'image/jpeg',
  extension: 'jpg',
  sizeBytes: 102400,
  storageProvider: 'local',
  bucket: 'test-bucket',
  objectKey: 'media/original/2025/01/abc123.jpg',
  visibility: 'public',
  status: 'ready',
  variants: [],
  uploadedBy: 'user1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  url: 'http://localhost:3000/storage/media/original/2025/01/abc123.jpg',
};

const client = createApiClient({ baseUrl: 'http://localhost:3001' });

describe('createAdminMediaClient', () => {
  describe('listMedia', () => {
    it('builds GET /admin/v1/media without params', async () => {
      mockJson({ items: [mockAsset], total: 1, page: 1, limit: 20 });
      const result = await createAdminMediaClient(client).listMedia();
      expect(result.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/admin/v1/media',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('appends query params when provided', async () => {
      mockJson({ items: [], total: 0, page: 1, limit: 20 });
      await createAdminMediaClient(client).listMedia({
        visibility: 'public',
        status: 'ready',
        page: 2,
        limit: 10,
      });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('visibility=public');
      expect(url).toContain('status=ready');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });
  });

  describe('getMedia', () => {
    it('builds GET /admin/v1/media/:id', async () => {
      mockJson(mockAsset);
      const result = await createAdminMediaClient(client).getMedia(ASSET_ID);
      expect(result.id).toBe(ASSET_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/media/${ASSET_ID}`,
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('updateMedia', () => {
    it('builds PATCH /admin/v1/media/:id', async () => {
      mockJson(mockAsset);
      await createAdminMediaClient(client).updateMedia(ASSET_ID, { visibility: 'private' });
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/media/${ASSET_ID}`,
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('regenerateVariants', () => {
    it('builds POST /admin/v1/media/:id/regenerate-variants', async () => {
      mockJson(mockAsset);
      const result = await createAdminMediaClient(client).regenerateVariants(ASSET_ID);
      expect(result.id).toBe(ASSET_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/media/${ASSET_ID}/regenerate-variants`,
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('deleteMedia', () => {
    it('builds DELETE /admin/v1/media/:id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
      await createAdminMediaClient(client).deleteMedia(ASSET_ID);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/admin/v1/media/${ASSET_ID}`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('error handling', () => {
    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not found' }, 404);
      await expect(createAdminMediaClient(client).getMedia('bad-id')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
