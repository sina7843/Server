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
  toMatch(pattern: RegExp | string): void;
  toBeUndefined(): void;
}

interface WebMockFunction {
  (...args: readonly unknown[]): unknown;
  mockResolvedValue(value: unknown): WebMockFunction;
  mockResolvedValueOnce(value: unknown): WebMockFunction;
  readonly mock: {
    readonly calls: ReadonlyArray<ReadonlyArray<unknown>>;
  };
}

declare const describe: (name: string, fn: WebTestFn) => void;
declare const it: (name: string, fn: WebTestFn) => void;
declare const expect: (actual: unknown) => WebExpectMatchers;
declare const jest: {
  fn(): WebMockFunction;
  fn<T extends WebMockFunction>(): T;
};

import { createSearchApi } from './search-api';

function makeFetcher(data: unknown, status = 200): WebMockFunction {
  return jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: async () => data,
  });
}

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

describe('createSearchApi', () => {
  it('searchContent sends GET /api/v1/search/content', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    await api.searchContent();
    const [[calledUrl, calledOpts]] = fetcher.mock.calls as [[string, { method: string }]];
    expect(calledUrl).toContain('/api/v1/search/content');
    expect(calledOpts.method).toContain('GET');
  });

  it('searchContent passes q query param', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    await api.searchContent({ q: 'football' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('q=football');
  });

  it('searchContent passes type filter', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    await api.searchContent({ type: 'news' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('type=news');
  });

  it('searchContent passes page and limit', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    await api.searchContent({ page: 2, limit: 10 });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=10');
  });

  it('result routes are type-specific — no /posts/:slug', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    const result = await api.searchContent();
    for (const item of result.items) {
      expect(item.route).not.toMatch(/^\/posts\//);
    }
  });

  it('news result uses /news/:slug route', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    const result = await api.searchContent();
    const newsItem = result.items.find((i) => i.type === 'news');
    expect(newsItem?.route).toMatch(/^\/news\//);
  });

  it('article result uses /articles/:slug route', async () => {
    const articleResult = {
      ...mockResult,
      items: [{ ...mockResult.items[0]!, type: 'article', route: '/articles/test-article' }],
    };
    const fetcher = makeFetcher(articleResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    const result = await api.searchContent({ type: 'article' });
    expect(result.items[0]?.route).toMatch(/^\/articles\//);
  });

  it('announcement result uses /announcements/:slug route', async () => {
    const annoResult = {
      ...mockResult,
      items: [
        { ...mockResult.items[0]!, type: 'announcement', route: '/announcements/test-article' },
      ],
    };
    const fetcher = makeFetcher(annoResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    const result = await api.searchContent({ type: 'announcement' });
    expect(result.items[0]?.route).toMatch(/^\/announcements\//);
  });

  it('guide result uses /guides/:slug route', async () => {
    const guideResult = {
      ...mockResult,
      items: [{ ...mockResult.items[0]!, type: 'guide', route: '/guides/test-article' }],
    };
    const fetcher = makeFetcher(guideResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    const result = await api.searchContent({ type: 'guide' });
    expect(result.items[0]?.route).toMatch(/^\/guides\//);
  });

  it('rule result uses /rules/:slug route', async () => {
    const ruleResult = {
      ...mockResult,
      items: [{ ...mockResult.items[0]!, type: 'rule', route: '/rules/test-article' }],
    };
    const fetcher = makeFetcher(ruleResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    const result = await api.searchContent({ type: 'rule' });
    expect(result.items[0]?.route).toMatch(/^\/rules\//);
  });

  it('page result uses /pages/:slug route', async () => {
    const pageResult = {
      ...mockResult,
      items: [{ ...mockResult.items[0]!, type: 'page', route: '/pages/test-article' }],
    };
    const fetcher = makeFetcher(pageResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    const result = await api.searchContent({ type: 'page' });
    expect(result.items[0]?.route).toMatch(/^\/pages\//);
  });

  it('passes categoryId query param', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    await api.searchContent({ categoryId: '64f000000000000000000010' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('categoryId=64f000000000000000000010');
  });

  it('passes tagId query param', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    await api.searchContent({ tagId: '64f000000000000000000020' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('tagId=64f000000000000000000020');
  });

  it('result preserves API item order', async () => {
    const orderedResult = {
      items: [
        {
          id: '1',
          type: 'news',
          title: 'First',
          slug: 'first',
          route: '/news/first',
          createdAt: '2026-01-02T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
        {
          id: '2',
          type: 'article',
          title: 'Second',
          slug: 'second',
          route: '/articles/second',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      page: 1,
      limit: 20,
      total: 2,
    };
    const fetcher = makeFetcher(orderedResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    const result = await api.searchContent();
    expect(result.items[0]?.id).toBe('1');
    expect(result.items[1]?.id).toBe('2');
  });

  it('has no Meilisearch-specific method', () => {
    const api = createSearchApi({ baseUrl: '/' });
    expect('searchWithRanking' in api).toBe(false);
    expect('meilisearchContent' in api).toBe(false);
  });

  it('has no analytics method', () => {
    const api = createSearchApi({ baseUrl: '/' });
    expect('getAnalytics' in api).toBe(false);
    expect('trackSearch' in api).toBe(false);
  });
});

describe('createSearchApi: does not expose draft/archived/deleted content', () => {
  it('URL sent does not contain status, includeDraft, or includeArchived params', async () => {
    const fetcher = makeFetcher(mockResult);
    const api = createSearchApi({ baseUrl: '/', fetcher: fetcher as never });
    await api.searchContent({ q: 'test' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).not.toContain('status=');
    expect(calledUrl).not.toContain('includeDraft');
    expect(calledUrl).not.toContain('includeArchived');
  });
});
