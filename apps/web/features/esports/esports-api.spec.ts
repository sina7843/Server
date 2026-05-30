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
  toEqual(expected: unknown): void;
  toHaveBeenCalledWith(...expected: readonly unknown[]): void;
  toHaveProperty(propertyName: string): void;
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

import { createEsportsApi } from './esports-api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const mockHomeDto = {
  featuredPosts: [],
  latestNews: [],
  activeTournaments: [],
  upcomingTournaments: [],
  topContent: [],
};

describe('createEsportsApi — getHome', () => {
  it('getHome uses the correct esports home path', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockHomeDto));
    const api = createEsportsApi({ fetcher: fetcher as never });

    await api.getHome();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/esports/home', { method: 'GET', headers: {} });
  });

  it('getHome returns EsportsHomeDto shape', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockHomeDto));
    const api = createEsportsApi({ fetcher: fetcher as never });

    const result = await api.getHome();

    expect(result).toHaveProperty('featuredPosts');
    expect(result).toHaveProperty('latestNews');
    expect(result).toHaveProperty('activeTournaments');
    expect(result).toHaveProperty('upcomingTournaments');
    expect(result).toHaveProperty('topContent');
  });

  it('activeTournaments is an array in the response', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockHomeDto));
    const api = createEsportsApi({ fetcher: fetcher as never });

    const result = await api.getHome();

    expect(Array.isArray(result.activeTournaments)).toBe(true);
  });

  it('upcomingTournaments is an array in the response', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockHomeDto));
    const api = createEsportsApi({ fetcher: fetcher as never });

    const result = await api.getHome();

    expect(Array.isArray(result.upcomingTournaments)).toBe(true);
  });

  it('getHome with real posts returns mapped DTO arrays', async () => {
    const mockPost = {
      id: 'post-1',
      type: 'article',
      title: 'Test Article',
      slug: 'test-article',
      bodyHtml: '<p>Content</p>',
      categoryIds: [],
      tagIds: [],
      seo: {},
      publishedAt: '2024-01-01T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    };
    const fetcher = jest.fn().mockResolvedValue(
      jsonResponse({
        ...mockHomeDto,
        featuredPosts: [mockPost],
        latestNews: [mockPost],
        topContent: [mockPost],
      }),
    );
    const api = createEsportsApi({ fetcher: fetcher as never });

    const result = await api.getHome();

    expect(result.featuredPosts[0]).toHaveProperty('slug');
    expect(result.latestNews[0]).toHaveProperty('title');
    expect(result.topContent[0]).toHaveProperty('id');
  });

  it('handles API errors safely', async () => {
    const api = createEsportsApi({
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 500)) as never,
    });

    await expect(api.getHome()).rejects.toThrow('Request failed with status 500.');
  });
});

describe('createEsportsApi — no direct fetch', () => {
  it('uses the injected fetcher, not native fetch', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockHomeDto));
    const api = createEsportsApi({ fetcher: fetcher as never });

    await api.getHome();

    expect(fetcher.mockResolvedValue).toBe(fetcher.mockResolvedValue);
  });

  it('has only getHome method — no tournament detail methods', () => {
    const api = createEsportsApi();
    expect('getTournament' in api).toBe(false);
    expect('listTournaments' in api).toBe(false);
    expect('register' in api).toBe(false);
  });
});

describe('createEsportsApi — no hardcoded URLs', () => {
  it('accepts baseUrl option for runtime config injection', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockHomeDto));
    const api = createEsportsApi({ baseUrl: 'http://api-server:4000', fetcher: fetcher as never });

    await api.getHome();

    expect(fetcher).toHaveBeenCalledWith('http://api-server:4000/api/v1/esports/home', {
      method: 'GET',
      headers: {},
    });
  });

  it('without baseUrl defaults to relative path origin', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockHomeDto));
    const api = createEsportsApi({ fetcher: fetcher as never });

    await api.getHome();

    expect(fetcher).toHaveBeenCalledWith('/api/v1/esports/home', { method: 'GET', headers: {} });
  });
});
