type WebTestFn = () => void | Promise<void>;

interface WebExpectMatchers {
  readonly not: WebExpectMatchers;
  readonly resolves: {
    toEqual(expected: unknown): Promise<void>;
  };
  readonly rejects: {
    toThrow(expected?: string): Promise<void>;
  };
  toBe(expected: unknown): void;
  toContain(expected: string): void;
  toEqual(expected: unknown): void;
  toHaveBeenCalledWith(...expected: readonly unknown[]): void;
  toHaveProperty(propertyName: string): void;
  toBeUndefined(): void;
}

interface WebMockFunction {
  (...args: readonly unknown[]): unknown;
  mockResolvedValue(value: unknown): WebMockFunction;
  mockResolvedValueOnce(value: unknown): WebMockFunction;
}

declare const describe: (name: string, fn: WebTestFn) => void;
declare const it: (name: string, fn: WebTestFn) => void;
declare const expect: (actual: unknown) => WebExpectMatchers;
declare const jest: {
  fn(): WebMockFunction;
};

import { createContentApi } from './content-api';
import { buildContentSeoHead } from './content-seo';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const mockPost = {
  id: 'post-1',
  type: 'news',
  title: 'Test News',
  slug: 'test-news',
  bodyHtml: '<p>Content</p>',
  categoryIds: [],
  tagIds: [],
  seo: {},
  publishedAt: '2024-01-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('createContentApi — list endpoints', () => {
  it('news list uses news API path', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, limit: 20 }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.listNews();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/news', { method: 'GET', headers: {} });
  });

  it('articles list uses articles API path', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, limit: 20 }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.listArticles();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/articles', { method: 'GET', headers: {} });
  });

  it('announcements list uses announcements API path', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, limit: 20 }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.listAnnouncements();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/announcements', {
      method: 'GET',
      headers: {},
    });
  });

  it('guides list uses guides API path', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, limit: 20 }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.listGuides();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/guides', { method: 'GET', headers: {} });
  });

  it('rules list uses rules API path', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, limit: 20 }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.listRules();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/rules', { method: 'GET', headers: {} });
  });

  it('category list uses categories API path', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ items: [] }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.listCategories();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/categories', { method: 'GET', headers: {} });
  });

  it('tag list uses tags API path', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ items: [] }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.listTags();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/tags', { method: 'GET', headers: {} });
  });
});

describe('createContentApi — detail endpoints', () => {
  it('news detail uses type-specific news lookup with slug', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ post: mockPost }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getNewsPost('test-news');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/news/test-news', {
      method: 'GET',
      headers: {},
    });
  });

  it('article detail uses article lookup with slug', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ post: mockPost }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getArticle('my-article');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/articles/my-article', {
      method: 'GET',
      headers: {},
    });
  });

  it('announcement detail uses announcement lookup with slug', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ post: mockPost }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getAnnouncement('my-announcement');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/announcements/my-announcement', {
      method: 'GET',
      headers: {},
    });
  });

  it('guide detail uses guide lookup with slug', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ post: mockPost }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getGuide('my-guide');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/guides/my-guide', {
      method: 'GET',
      headers: {},
    });
  });

  it('rule detail uses rule lookup with slug', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ post: mockPost }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getRule('my-rule');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/rules/my-rule', {
      method: 'GET',
      headers: {},
    });
  });

  it('page detail uses page slug lookup', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      jsonResponse({
        page: {
          id: 'p1',
          title: 'About',
          slug: 'about',
          bodyHtml: '',
          seo: {},
          publishedAt: '',
          createdAt: '',
        },
      }),
    );
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getPage('about');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/pages/about', {
      method: 'GET',
      headers: {},
    });
  });

  it('category page uses category API with slug', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(
        jsonResponse({ category: { id: 'c1', name: 'Tech', slug: 'tech', sortOrder: 0 } }),
      );
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getCategory('tech');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/categories/tech', {
      method: 'GET',
      headers: {},
    });
  });

  it('tag page uses tag API with slug', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(jsonResponse({ tag: { id: 't1', name: 'Vue', slug: 'vue' } }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getTag('vue');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/tags/vue', { method: 'GET', headers: {} });
  });

  it('detail slugs are URL-encoded', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ post: mockPost }));
    const api = createContentApi({ fetcher: fetcher as never });

    await api.getNewsPost('my news/post');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/news/my%20news%2Fpost', {
      method: 'GET',
      headers: {},
    });
  });
});

describe('createContentApi — no generic /posts route', () => {
  it('has no getPost generic method', () => {
    const api = createContentApi();
    expect('getPost' in api).toBe(false);
  });

  it('has no listPosts generic method', () => {
    const api = createContentApi();
    expect('listPosts' in api).toBe(false);
  });
});

describe('createContentApi — no forbidden methods', () => {
  it('has no uploadMedia method', () => {
    const api = createContentApi();
    expect('uploadMedia' in api).toBe(false);
  });

  it('has no mediaPicker method', () => {
    const api = createContentApi();
    expect('mediaPicker' in api).toBe(false);
  });

  it('has no comments method', () => {
    const api = createContentApi();
    expect('listComments' in api).toBe(false);
  });

  it('handles errors safely', async () => {
    const api = createContentApi({
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 500)) as never,
    });

    await expect(api.listNews()).rejects.toThrow('Request failed with status 500.');
  });
});

describe('buildContentSeoHead — SEO metadata', () => {
  it('uses seo.title over fallback title', () => {
    const head = buildContentSeoHead({ title: 'Fallback', seo: { title: 'SEO Title' } });
    expect(head.title).toEqual('SEO Title');
  });

  it('falls back to provided title when seo.title absent', () => {
    const head = buildContentSeoHead({ title: 'Page Title' });
    expect(head.title).toEqual('Page Title');
  });

  it('includes description meta tag', () => {
    const head = buildContentSeoHead({
      title: 'T',
      seo: { description: 'A description' },
    });
    const descMeta = head.meta.find((m) => m.name === 'description');
    expect(descMeta?.content).toEqual('A description');
  });

  it('sets noindex robots meta when noIndex is true', () => {
    const head = buildContentSeoHead({ title: 'T', noIndex: true });
    const robotsMeta = head.meta.find((m) => m.name === 'robots');
    expect(robotsMeta?.content).toEqual('noindex,follow');
  });

  it('sets noindex robots meta when seo.noIndex is true', () => {
    const head = buildContentSeoHead({ title: 'T', seo: { noIndex: true } });
    const robotsMeta = head.meta.find((m) => m.name === 'robots');
    expect(robotsMeta?.content).toEqual('noindex,follow');
  });

  it('does not set noindex when not requested', () => {
    const head = buildContentSeoHead({ title: 'T', seo: {} });
    const robotsMeta = head.meta.find((m) => m.name === 'robots');
    expect(robotsMeta).toBeUndefined();
  });

  it('includes OG title when not noIndex', () => {
    const head = buildContentSeoHead({ title: 'My Page', seo: {} });
    const ogTitle = head.meta.find((m) => m.property === 'og:title');
    expect(ogTitle?.content).toEqual('My Page');
  });

  it('omits OG tags when noIndex', () => {
    const head = buildContentSeoHead({ title: 'T', noIndex: true });
    const ogTitle = head.meta.find((m) => m.property === 'og:title');
    expect(ogTitle).toBeUndefined();
  });

  it('includes canonical link when canonicalUrl is provided', () => {
    const head = buildContentSeoHead({
      title: 'T',
      seo: { canonicalUrl: 'https://example.com/page' },
    });
    const canonical = head.link.find((l) => l.rel === 'canonical');
    expect(canonical?.href).toEqual('https://example.com/page');
  });

  it('does not include canonical link when absent', () => {
    const head = buildContentSeoHead({ title: 'T' });
    expect(head.link.length).toEqual(0);
  });

  it('not-found state results in noindex', () => {
    const head = buildContentSeoHead({ title: 'Not Found', noIndex: true });
    const robotsMeta = head.meta.find((m) => m.name === 'robots');
    expect(robotsMeta?.content).toEqual('noindex,follow');
  });

  it('error state results in noindex', () => {
    const head = buildContentSeoHead({ title: 'Error', noIndex: true });
    const robotsMeta = head.meta.find((m) => m.name === 'robots');
    expect(robotsMeta?.content).toEqual('noindex,follow');
  });
});

describe('detail renders bodyHtml not bodyJson', () => {
  it('post response envelope exposes bodyHtml field', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ post: mockPost }));
    const api = createContentApi({ fetcher: fetcher as never });

    const result = await api.getNewsPost('test-news');

    expect(result.post).toHaveProperty('bodyHtml');
    expect('bodyJson' in result.post).toBe(false);
  });

  it('ContentHtmlRenderer is the rendering boundary — bodyHtml is a string', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse({ post: mockPost }));
    const api = createContentApi({ fetcher: fetcher as never });

    const result = await api.getNewsPost('test-news');

    expect(typeof result.post.bodyHtml).toBe('string');
  });
});
