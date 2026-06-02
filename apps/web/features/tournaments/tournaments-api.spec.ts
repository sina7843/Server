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
  toBeUndefined(): void;
  toHaveBeenCalledWith(...expected: readonly unknown[]): void;
  toHaveProperty(propertyName: string): void;
}

interface WebMockFunction {
  (...args: readonly unknown[]): unknown;
  mockResolvedValue(value: unknown): WebMockFunction;
  mockResolvedValueOnce(value: unknown): WebMockFunction;
  readonly mock: { readonly calls: ReadonlyArray<ReadonlyArray<unknown>> };
}

declare const describe: (name: string, fn: WebTestFn) => void;
declare const it: (name: string, fn: WebTestFn) => void;
declare const expect: (actual: unknown) => WebExpectMatchers;
declare const jest: {
  fn(): WebMockFunction;
};

import {
  createTournamentsDiscoveryApi,
  createTournamentSearchApi,
  createGamesDiscoveryApi,
} from './tournaments-api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const mockListResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
};

// ─── createTournamentsDiscoveryApi ────────────────────────────────────────────

describe('createTournamentsDiscoveryApi — no hardcoded URLs', () => {
  it('accepts configurable baseUrl (no hardcoded domain)', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({
      baseUrl: 'https://custom.example.com',
      fetcher: fetcher as never,
    });
    await api.list();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('https://custom.example.com');
    expect(calledUrl).not.toContain('localhost');
    expect(calledUrl).not.toContain('qesb.ir');
  });

  it('without baseUrl defaults to relative path', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('/api/v1/tournaments');
    expect(calledUrl).not.toContain('localhost');
  });
});

describe('createTournamentsDiscoveryApi — list()', () => {
  it('hits GET /api/v1/tournaments with no params', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('/api/v1/tournaments');
  });

  it('passes gameId filter', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list({ gameId: 'game-1' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('gameId=game-1');
  });

  it('passes status filter', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list({ status: 'registration_open' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('status=registration_open');
  });

  it('passes format filter', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list({ format: 'single_elimination' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('format=single_elimination');
  });

  it('passes registrationOpen filter', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list({ registrationOpen: true });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('registrationOpen=true');
  });

  it('passes page and limit', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list({ page: 2, limit: 10 });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=10');
  });

  it('returns TournamentListResponseDto shape', async () => {
    const body = { items: [], total: 5, page: 1, limit: 20 };
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(body));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    const result = await api.list();
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
  });

  it('throws on non-2xx response', async () => {
    const api = createTournamentsDiscoveryApi({
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 500)) as never,
    });
    await expect(api.list()).rejects.toThrow('Request failed with status 500.');
  });

  it('has no q parameter — text search uses search.tournaments()', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list({ gameId: 'g1' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).not.toContain('q=');
  });
});

// ─── createTournamentSearchApi ────────────────────────────────────────────────

describe('createTournamentSearchApi — no hardcoded URLs', () => {
  it('accepts configurable baseUrl', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentSearchApi({
      baseUrl: 'https://custom.example.com',
      fetcher: fetcher as never,
    });
    await api.tournaments();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('https://custom.example.com');
    expect(calledUrl).not.toContain('localhost');
    expect(calledUrl).not.toContain('qesb.ir');
  });
});

describe('createTournamentSearchApi — tournaments()', () => {
  it('hits the search/tournaments endpoint', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentSearchApi({ fetcher: fetcher as never });
    await api.tournaments();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('/api/v1/search/tournaments');
  });

  it('passes q param for text search', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentSearchApi({ fetcher: fetcher as never });
    await api.tournaments({ q: 'dragon' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('q=dragon');
  });

  it('passes combined filters', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentSearchApi({ fetcher: fetcher as never });
    await api.tournaments({ q: 'cup', status: 'registration_open', gameId: 'g1' });
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('q=cup');
    expect(calledUrl).toContain('status=registration_open');
    expect(calledUrl).toContain('gameId=g1');
  });

  it('returns TournamentListResponseDto shape', async () => {
    const body = { items: [], total: 0, page: 1, limit: 20 };
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(body));
    const api = createTournamentSearchApi({ fetcher: fetcher as never });
    const result = await api.tournaments({ q: 'test' });
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
  });

  it('throws on non-2xx', async () => {
    const api = createTournamentSearchApi({
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 503)) as never,
    });
    await expect(api.tournaments({ q: 'x' })).rejects.toThrow('Request failed with status 503.');
  });
});

// ─── createGamesDiscoveryApi ──────────────────────────────────────────────────

describe('createGamesDiscoveryApi — no hardcoded URLs', () => {
  it('accepts configurable baseUrl', async () => {
    const gamesRes = { items: [], total: 0, page: 1, limit: 100 };
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(gamesRes));
    const api = createGamesDiscoveryApi({
      baseUrl: 'https://custom.example.com',
      fetcher: fetcher as never,
    });
    await api.list();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('https://custom.example.com');
    expect(calledUrl).not.toContain('localhost');
    expect(calledUrl).not.toContain('qesb.ir');
  });
});

describe('createGamesDiscoveryApi — list()', () => {
  it('hits GET /api/v1/games', async () => {
    const gamesRes = { items: [], total: 0, page: 1, limit: 100 };
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(gamesRes));
    const api = createGamesDiscoveryApi({ fetcher: fetcher as never });
    await api.list();
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('/api/v1/games');
  });

  it('returns GamePublicListResponseDto shape', async () => {
    const body = {
      items: [{ id: 'g1', slug: 'valorant', name: 'Valorant' }],
      total: 1,
      page: 1,
      limit: 100,
    };
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(body));
    const api = createGamesDiscoveryApi({ fetcher: fetcher as never });
    const result = await api.list();
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
  });
});

// ─── SDK delegation ───────────────────────────────────────────────────────────

describe('SDK delegation (no direct fetch)', () => {
  it('createTournamentsDiscoveryApi uses the injected fetcher, not native fetch', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentsDiscoveryApi({ fetcher: fetcher as never });
    await api.list();
    expect(fetcher.mockResolvedValue).toBe(fetcher.mockResolvedValue);
  });

  it('createTournamentSearchApi uses the injected fetcher, not native fetch', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockListResponse));
    const api = createTournamentSearchApi({ fetcher: fetcher as never });
    await api.tournaments();
    expect(fetcher.mockResolvedValue).toBe(fetcher.mockResolvedValue);
  });
});
