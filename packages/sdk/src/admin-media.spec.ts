import { createAdminMediaClient } from './admin-media';
import type { ApiClient } from './client';

function makeClient(mockRequest: jest.Mock): ApiClient {
  return { request: mockRequest };
}

describe('createAdminMediaClient', () => {
  let requestMock: jest.Mock;

  beforeEach(() => {
    requestMock = jest.fn().mockResolvedValue({});
  });

  describe('listMedia', () => {
    it('builds GET /admin/v1/media without params', async () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      await client.listMedia();
      expect(requestMock).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/media' }),
      );
    });

    it('appends query params to the path', async () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      await client.listMedia({ visibility: 'public', status: 'ready', page: 2, limit: 10 });
      const [call] = requestMock.mock.calls;
      expect(call[0].path).toContain('visibility=public');
      expect(call[0].path).toContain('status=ready');
      expect(call[0].path).toContain('page=2');
      expect(call[0].path).toContain('limit=10');
    });
  });

  describe('uploadMedia', () => {
    it('builds POST /admin/v1/media/upload with FormData body', async () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      await client.uploadMedia({
        file: new Blob(['data'], { type: 'image/jpeg' }),
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        visibility: 'public',
      });
      const [call] = requestMock.mock.calls;
      expect(call[0].method).toBe('POST');
      expect(call[0].path).toBe('/admin/v1/media/upload');
      expect(call[0].body).toBeInstanceOf(FormData);
    });

    it('includes alt and caption in the FormData when provided', async () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      const appendSpy = jest.spyOn(FormData.prototype, 'append');
      await client.uploadMedia({
        file: new Blob(['data'], { type: 'image/jpeg' }),
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        alt: 'A photo',
        caption: 'Caption text',
      });
      const calls = appendSpy.mock.calls.map((c) => c[0]);
      expect(calls).toContain('alt');
      expect(calls).toContain('caption');
      appendSpy.mockRestore();
    });

    it('does not add a direct-to-S3 upload method', () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      expect((client as unknown as Record<string, unknown>).presignUpload).toBeUndefined();
      expect((client as unknown as Record<string, unknown>).directS3Upload).toBeUndefined();
    });
  });

  describe('getMedia', () => {
    it('builds GET /admin/v1/media/:id', async () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      await client.getMedia('abc123');
      expect(requestMock).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/media/abc123' }),
      );
    });

    it('URL-encodes the id', async () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      await client.getMedia('id with spaces');
      const [call] = requestMock.mock.calls;
      expect(call[0].path).toBe('/admin/v1/media/id%20with%20spaces');
    });
  });

  describe('updateMedia', () => {
    it('builds PATCH /admin/v1/media/:id with JSON body', async () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      await client.updateMedia('abc123', { alt: 'Updated alt', visibility: 'private' });
      const [call] = requestMock.mock.calls;
      expect(call[0].method).toBe('PATCH');
      expect(call[0].path).toBe('/admin/v1/media/abc123');
      expect(call[0].headers?.['content-type']).toBe('application/json');
      expect(JSON.parse(call[0].body as string)).toEqual({
        alt: 'Updated alt',
        visibility: 'private',
      });
    });
  });

  describe('deleteMedia', () => {
    it('builds DELETE /admin/v1/media/:id', async () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      await client.deleteMedia('abc123');
      expect(requestMock).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE', path: '/admin/v1/media/abc123' }),
      );
    });
  });

  describe('SDK invariants', () => {
    it('does not expose a regenerate variants method', () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      expect((client as unknown as Record<string, unknown>).regenerateVariants).toBeUndefined();
    });

    it('does not expose a multipart upload method', () => {
      const client = createAdminMediaClient(makeClient(requestMock));
      expect((client as unknown as Record<string, unknown>).multipartUpload).toBeUndefined();
    });
  });
});
