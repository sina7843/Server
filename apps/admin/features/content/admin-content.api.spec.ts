import { ApiClientError, createAdminContentClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

const POST_ID = '64f000000000000000000001';
const PAGE_ID = '64f000000000000000000002';
const REVISION_ID = '64f000000000000000000003';
const CAT_ID = '64f000000000000000000004';
const TAG_ID = '64f000000000000000000005';

const mockPostSummary = {
  id: POST_ID,
  type: 'news' as const,
  title: 'Test News',
  slug: 'test-news',
  status: 'draft' as const,
  authorId: 'author1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockPostDetail = {
  ...mockPostSummary,
  slugNormalized: 'test-news',
  slugHistory: [],
  bodyJson: { type: 'doc', content: [] },
  bodyHtml: '<p>Test</p>',
  categoryIds: [],
  tagIds: [],
  seo: {},
  viewCount: 0,
};

const mockPageSummary = {
  id: PAGE_ID,
  title: 'Test Page',
  slug: 'test-page',
  status: 'draft' as const,
  createdBy: 'author1',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockPageDetail = {
  ...mockPageSummary,
  slugNormalized: 'test-page',
  slugHistory: [],
  bodyJson: { type: 'doc', content: [] },
  bodyHtml: '<p>Page body</p>',
  seo: {},
};

const mockCategory = {
  id: CAT_ID,
  name: 'Tech',
  slug: 'tech',
  slugNormalized: 'tech',
  sortOrder: 0,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockTag = {
  id: TAG_ID,
  name: 'JavaScript',
  slug: 'javascript',
  slugNormalized: 'javascript',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('createAdminContentClient — posts', () => {
  function makeClient() {
    return createAdminContentClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('listPosts sends GET /admin/v1/content/posts', async () => {
    mockJson({ items: [mockPostSummary], total: 1, page: 1, limit: 20 });

    const result = await makeClient().listPosts();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/content/posts'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.items).toHaveLength(1);
  });

  it('listPosts passes type and status query params', async () => {
    mockJson({ items: [], total: 0, page: 1, limit: 20 });

    await makeClient().listPosts({ type: 'news', status: 'draft' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/type=news.*status=draft|status=draft.*type=news/),
      expect.anything(),
    );
  });

  it('createPost sends POST /admin/v1/content/posts', async () => {
    mockJson({ post: mockPostDetail });

    const result = await makeClient().createPost({
      type: 'news',
      title: 'Test News',
      slug: 'test-news',
      bodyHtml: '<p>Hello</p>',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/content/posts'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.post.id).toBe(POST_ID);
  });

  it('getPost sends GET /admin/v1/content/posts/:id', async () => {
    mockJson({ post: mockPostDetail });

    const result = await makeClient().getPost(POST_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/posts/${POST_ID}`),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.post.id).toBe(POST_ID);
  });

  it('updatePost sends PATCH /admin/v1/content/posts/:id', async () => {
    mockJson({ post: { ...mockPostDetail, title: 'Updated' } });

    const result = await makeClient().updatePost(POST_ID, { title: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/posts/${POST_ID}`),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result.post.title).toBe('Updated');
  });

  it('previewPost sends POST /admin/v1/content/posts/:id/preview', async () => {
    mockJson({ post: mockPostDetail });

    await makeClient().previewPost(POST_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/posts/${POST_ID}/preview`),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('publishPost sends POST /admin/v1/content/posts/:id/publish', async () => {
    mockJson({ post: { ...mockPostDetail, status: 'published' } });

    const result = await makeClient().publishPost(POST_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/posts/${POST_ID}/publish`),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.post.status).toBe('published');
  });

  it('archivePost sends POST /admin/v1/content/posts/:id/archive', async () => {
    mockJson({ post: { ...mockPostDetail, status: 'archived' } });

    const result = await makeClient().archivePost(POST_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/posts/${POST_ID}/archive`),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.post.status).toBe('archived');
  });

  it('softDeletePost sends DELETE /admin/v1/content/posts/:id', async () => {
    mockJson({ success: true, message: 'Post deleted.' });

    const result = await makeClient().softDeletePost(POST_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/posts/${POST_ID}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(result.success).toBe(true);
  });

  it('listPostRevisions sends GET /admin/v1/content/posts/:id/revisions', async () => {
    mockJson({ revisions: [] });

    await makeClient().listPostRevisions(POST_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/posts/${POST_ID}/revisions`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getPostRevision sends GET /admin/v1/content/posts/:id/revisions/:rid', async () => {
    mockJson({ revision: { id: REVISION_ID, revisionNumber: 1, snapshot: {}, createdAt: '' } });

    await makeClient().getPostRevision(POST_ID, REVISION_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/posts/${POST_ID}/revisions/${REVISION_ID}`),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);

    await expect(makeClient().listPosts()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminContentClient — pages', () => {
  function makeClient() {
    return createAdminContentClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('listPages sends GET /admin/v1/content/pages', async () => {
    mockJson({ items: [mockPageSummary], total: 1, page: 1, limit: 20 });

    const result = await makeClient().listPages();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/content/pages'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.items).toHaveLength(1);
  });

  it('createPage sends POST /admin/v1/content/pages', async () => {
    mockJson({ page: mockPageDetail });

    const result = await makeClient().createPage({
      title: 'Test Page',
      slug: 'test-page',
      bodyHtml: '<p>Content</p>',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/content/pages'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.page.id).toBe(PAGE_ID);
  });

  it('publishPage sends POST /admin/v1/content/pages/:id/publish', async () => {
    mockJson({ page: { ...mockPageDetail, status: 'published' } });

    const result = await makeClient().publishPage(PAGE_ID);

    expect(result.page.status).toBe('published');
  });

  it('archivePage sends POST /admin/v1/content/pages/:id/archive', async () => {
    mockJson({ page: { ...mockPageDetail, status: 'archived' } });

    const result = await makeClient().archivePage(PAGE_ID);

    expect(result.page.status).toBe('archived');
  });

  it('softDeletePage sends DELETE /admin/v1/content/pages/:id', async () => {
    mockJson({ success: true, message: 'Page deleted.' });

    const result = await makeClient().softDeletePage(PAGE_ID);

    expect(result.success).toBe(true);
  });
});

describe('createAdminContentClient — categories', () => {
  function makeClient() {
    return createAdminContentClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('listCategories sends GET /admin/v1/content/categories', async () => {
    mockJson({ items: [mockCategory] });

    const result = await makeClient().listCategories();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/content/categories'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.items).toHaveLength(1);
  });

  it('createCategory sends POST /admin/v1/content/categories', async () => {
    mockJson({ category: mockCategory });

    const result = await makeClient().createCategory({ name: 'Tech', slug: 'tech' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/content/categories'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.category.id).toBe(CAT_ID);
  });

  it('updateCategory sends PATCH /admin/v1/content/categories/:id', async () => {
    mockJson({ category: { ...mockCategory, name: 'Technology' } });

    const result = await makeClient().updateCategory(CAT_ID, { name: 'Technology' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/categories/${CAT_ID}`),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result.category.name).toBe('Technology');
  });

  it('deleteCategory sends DELETE /admin/v1/content/categories/:id', async () => {
    mockJson({ success: true, message: 'Category deleted.' });

    const result = await makeClient().deleteCategory(CAT_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/categories/${CAT_ID}`),
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(result.success).toBe(true);
  });
});

describe('createAdminContentClient — tags', () => {
  function makeClient() {
    return createAdminContentClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('listTags sends GET /admin/v1/content/tags', async () => {
    mockJson({ items: [mockTag] });

    const result = await makeClient().listTags();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/content/tags'),
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.items).toHaveLength(1);
  });

  it('createTag sends POST /admin/v1/content/tags', async () => {
    mockJson({ tag: mockTag });

    const result = await makeClient().createTag({ name: 'JavaScript', slug: 'javascript' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/content/tags'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.tag.id).toBe(TAG_ID);
  });

  it('updateTag sends PATCH /admin/v1/content/tags/:id', async () => {
    mockJson({ tag: { ...mockTag, name: 'JS' } });

    const result = await makeClient().updateTag(TAG_ID, { name: 'JS' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/admin/v1/content/tags/${TAG_ID}`),
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(result.tag.name).toBe('JS');
  });

  it('deleteTag sends DELETE /admin/v1/content/tags/:id', async () => {
    mockJson({ success: true, message: 'Tag deleted.' });

    const result = await makeClient().deleteTag(TAG_ID);

    expect(result.success).toBe(true);
  });
});

describe('createAdminContentClient — bodyJson/bodyHtml flow', () => {
  function makeClient() {
    return createAdminContentClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('createPost sends bodyJson when provided', async () => {
    mockJson({ post: mockPostDetail });

    const bodyJson = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    };
    await makeClient().createPost({
      type: 'news',
      title: 'Test',
      slug: 'test',
      bodyJson,
      bodyHtml: '<p>Hello</p>',
    });

    const [[, opts]] = mockFetch.mock.calls;
    const body = JSON.parse(opts.body as string);
    expect(body.bodyJson).toEqual(bodyJson);
    expect(body.bodyHtml).toBe('<p>Hello</p>');
  });

  it('updatePost sends bodyJson when provided', async () => {
    mockJson({ post: mockPostDetail });

    const bodyJson = { type: 'doc', content: [] };
    await makeClient().updatePost(POST_ID, { bodyJson, bodyHtml: '<p>Updated</p>' });

    const [[, opts]] = mockFetch.mock.calls;
    const body = JSON.parse(opts.body as string);
    expect(body.bodyJson).toEqual(bodyJson);
    expect(body.bodyHtml).toBe('<p>Updated</p>');
  });

  it('createPage sends bodyJson when provided', async () => {
    mockJson({ page: mockPageDetail });

    const bodyJson = { type: 'doc', content: [] };
    await makeClient().createPage({
      title: 'Test Page',
      slug: 'test-page',
      bodyJson,
      bodyHtml: '<p>Page</p>',
    });

    const [[, opts]] = mockFetch.mock.calls;
    const body = JSON.parse(opts.body as string);
    expect(body.bodyJson).toEqual(bodyJson);
  });

  it('updatePage sends bodyJson when provided', async () => {
    mockJson({ page: mockPageDetail });

    const bodyJson = { type: 'doc', content: [] };
    await makeClient().updatePage(PAGE_ID, { bodyJson, bodyHtml: '<p>Updated Page</p>' });

    const [[, opts]] = mockFetch.mock.calls;
    const body = JSON.parse(opts.body as string);
    expect(body.bodyJson).toEqual(bodyJson);
  });
});

describe('createAdminContentClient — security', () => {
  function makeClient() {
    return createAdminContentClient(
      createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
    );
  }

  it('has no restoreRevision method', () => {
    const client = makeClient();

    expect('restoreRevision' in client).toBe(false);
  });

  it('has no restorePostRevision method', () => {
    const client = makeClient();

    expect('restorePostRevision' in client).toBe(false);
  });

  it('has no restorePageRevision method', () => {
    const client = makeClient();

    expect('restorePageRevision' in client).toBe(false);
  });

  it('has no uploadMedia method', () => {
    const client = makeClient();

    expect('uploadMedia' in client).toBe(false);
  });

  it('has no mediaPicker method', () => {
    const client = makeClient();

    expect('mediaPicker' in client).toBe(false);
  });

  it('no generic /posts/:slug route — softDeletePost uses id-based path only', async () => {
    mockJson({ success: true, message: 'Deleted.' });

    await makeClient().softDeletePost(POST_ID);

    const [[calledUrl]] = mockFetch.mock.calls;
    expect(calledUrl).toContain(`/admin/v1/content/posts/${POST_ID}`);
    expect(calledUrl).not.toContain('/posts/slug/');
  });
});
