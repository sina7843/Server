import { ApiClientError, createAdminSearchClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
Object.assign(globalThis, { fetch: mockFetch });

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

const mockSearchResult = {
  items: [
    {
      id: '64f000000000000000000001',
      type: 'user',
      title: '***01',
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
      id: '64f000000000000000000002',
      type: 'news',
      title: 'Draft Article',
      slug: 'draft-article',
      route: '/news/draft-article',
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
      id: '64f000000000000000000003',
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

function makeClient() {
  return createAdminSearchClient(
    createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
  );
}

describe('createAdminSearchClient: searchUsers', () => {
  it('sends GET /admin/v1/search/users', async () => {
    mockJson(mockSearchResult);
    await makeClient().searchUsers();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/search/users'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('passes q query param', async () => {
    mockJson(mockSearchResult);
    await makeClient().searchUsers({ q: '09121' });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=09121'), expect.anything());
  });

  it('passes page and limit params', async () => {
    mockJson(mockSearchResult);
    await makeClient().searchUsers({ page: 2, limit: 10 });
    const [[calledUrl]] = mockFetch.mock.calls as [[string]];
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=10');
  });

  it('user result title is masked phone — never raw phone', async () => {
    mockJson(mockSearchResult);
    const result = await makeClient().searchUsers({ q: '09121' });
    for (const item of result.items) {
      // The backend masks phones; client just receives the masked title.
      // Title should not be a full 11-digit Iranian number.
      expect(item.title).not.toMatch(/^09\d{9}$/);
    }
  });

  it('result does not contain passwordHash or tokens', async () => {
    mockJson(mockSearchResult);
    const result = await makeClient().searchUsers();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('refreshToken');
    expect(serialized).not.toContain('accessToken');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().searchUsers()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminSearchClient: searchContent', () => {
  it('sends GET /admin/v1/search/content', async () => {
    mockJson(mockContentResult);
    await makeClient().searchContent();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/search/content'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('passes q query param', async () => {
    mockJson(mockContentResult);
    await makeClient().searchContent({ q: 'football' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('q=football'),
      expect.anything(),
    );
  });

  it('admin content result can include status field (sees drafts)', async () => {
    mockJson(mockContentResult);
    const result = await makeClient().searchContent();
    const item = result.items[0];
    expect(item?.status).toBeDefined();
  });

  it('content result does not link to /posts/:slug', async () => {
    mockJson(mockContentResult);
    const result = await makeClient().searchContent();
    for (const item of result.items) {
      expect(item.route).not.toMatch(/^\/posts\//);
    }
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().searchContent()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminSearchClient: searchMedia', () => {
  it('sends GET /admin/v1/search/media', async () => {
    mockJson(mockMediaResult);
    await makeClient().searchMedia();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/search/media'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('passes q query param', async () => {
    mockJson(mockMediaResult);
    await makeClient().searchMedia({ q: 'photo' });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=photo'), expect.anything());
  });

  it('media result does not contain objectKey or bucket', async () => {
    mockJson(mockMediaResult);
    const result = await makeClient().searchMedia();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('objectKey');
    expect(serialized).not.toContain('bucket');
    expect(serialized).not.toContain('storageProvider');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().searchMedia()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminSearchClient: reindex', () => {
  it('sends POST /admin/v1/search/reindex', async () => {
    mockJson({ queued: true, message: 'Reindex queued.' });
    await makeClient().reindex();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/search/reindex'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends scope in request body', async () => {
    mockJson({ queued: true, message: 'Reindex queued.', scope: 'content' });
    await makeClient().reindex({ scope: 'content' });
    const [[, init]] = mockFetch.mock.calls as [[string, RequestInit]];
    expect(JSON.parse(init.body as string)).toMatchObject({ scope: 'content' });
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().reindex()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminSearchClient: no frontend ranking', () => {
  it('SDK has no searchWithRanking method', () => {
    const client = makeClient();
    expect('searchWithRanking' in client).toBe(false);
  });

  it('SDK has no Meilisearch-specific method', () => {
    const client = makeClient();
    expect('meilisearchUsers' in client).toBe(false);
    expect('meilisearchContent' in client).toBe(false);
  });

  it('SDK has no analytics method in this task', () => {
    const client = makeClient();
    expect('getAnalytics' in client).toBe(false);
    expect('trackSearch' in client).toBe(false);
  });
});
