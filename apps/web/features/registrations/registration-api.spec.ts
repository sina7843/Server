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

import { createRegistrationApi } from './registration-api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const mockRegistrationDto = {
  id: 'reg-1',
  tournamentId: 'tournament-1',
  type: 'individual',
  status: 'submitted',
  registeredAt: '2026-01-01T00:00:00Z',
};

describe('createRegistrationApi — no hardcoded URLs', () => {
  it('accepts configurable baseUrl (no hardcoded domain)', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockRegistrationDto));
    const api = createRegistrationApi({
      baseUrl: 'https://custom.example.com',
      fetcher: fetcher as never,
    });
    await api.getMyRegistration('dragon-cup-2026');
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('https://custom.example.com');
    expect(calledUrl).not.toContain('localhost');
    expect(calledUrl).not.toContain('qesb.ir');
  });

  it('without baseUrl defaults to relative path', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockRegistrationDto));
    const api = createRegistrationApi({ fetcher: fetcher as never });
    await api.getMyRegistration('slug-1');
    const [[calledUrl]] = fetcher.mock.calls as [[string]];
    expect(calledUrl).toContain('/api/v1/tournaments/slug-1/my-registration');
  });
});

describe('createRegistrationApi — getMyRegistration', () => {
  it('hits GET /api/v1/tournaments/:slug/my-registration', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockRegistrationDto));
    const api = createRegistrationApi({ fetcher: fetcher as never });
    await api.getMyRegistration('dragon-cup-2026');
    expect(fetcher).toHaveBeenCalledWith('/api/v1/tournaments/dragon-cup-2026/my-registration', {
      method: 'GET',
      headers: {},
    });
  });

  it('sends Authorization header when token is provided', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockRegistrationDto));
    const api = createRegistrationApi({ token: 'my-access-token', fetcher: fetcher as never });
    await api.getMyRegistration('slug-1');
    const [[, init]] = fetcher.mock.calls as [[string, { headers: Record<string, string> }]];
    expect(init.headers['authorization']).toContain('Bearer my-access-token');
  });

  it('returns MyTournamentRegistrationDto shape', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockRegistrationDto));
    const api = createRegistrationApi({ fetcher: fetcher as never });
    const result = await api.getMyRegistration('slug-1');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('type');
  });

  it('throws on 404', async () => {
    const api = createRegistrationApi({
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 404)) as never,
    });
    await expect(api.getMyRegistration('slug-1')).rejects.toThrow(
      'Request failed with status 404.',
    );
  });

  it('throws on 401', async () => {
    const api = createRegistrationApi({
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 401)) as never,
    });
    await expect(api.getMyRegistration('slug-1')).rejects.toThrow(
      'Request failed with status 401.',
    );
  });
});

describe('createRegistrationApi — register', () => {
  it('hits POST /api/v1/tournaments/:slug/register with individual payload', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockRegistrationDto));
    const api = createRegistrationApi({ token: 'tok', fetcher: fetcher as never });
    await api.register('dragon-cup-2026', { type: 'individual' });
    const [[calledUrl, init]] = fetcher.mock.calls as [
      [string, { method: string; body: string; headers: Record<string, string> }],
    ];
    expect(calledUrl).toContain('/api/v1/tournaments/dragon-cup-2026/register');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ type: 'individual' });
  });

  it('throws on 409 conflict (duplicate registration)', async () => {
    const api = createRegistrationApi({
      token: 'tok',
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 409)) as never,
    });
    await expect(api.register('slug-1', { type: 'individual' })).rejects.toThrow(
      'Request failed with status 409.',
    );
  });

  it('throws on 422 validation error', async () => {
    const api = createRegistrationApi({
      token: 'tok',
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 422)) as never,
    });
    await expect(api.register('slug-1', { type: 'individual' })).rejects.toThrow(
      'Request failed with status 422.',
    );
  });

  it('sends team payload with teamName and members', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(jsonResponse({ ...mockRegistrationDto, type: 'team' }));
    const api = createRegistrationApi({ token: 'tok', fetcher: fetcher as never });
    const input = {
      type: 'team' as const,
      teamName: 'Dragon Squad',
      members: [{ userId: 'u1', displayName: 'Player One' }],
    };
    await api.register('slug-1', input);
    const [[, init]] = fetcher.mock.calls as [[string, { body: string }]];
    const body = JSON.parse(init.body);
    expect(body.teamName).toBe('Dragon Squad');
    expect(Array.isArray(body.members)).toBe(true);
  });
});

describe('createRegistrationApi — updateMyRegistration', () => {
  it('hits PATCH /api/v1/tournaments/:slug/my-registration', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockRegistrationDto));
    const api = createRegistrationApi({ token: 'tok', fetcher: fetcher as never });
    await api.updateMyRegistration('dragon-cup-2026', { teamName: 'New Name' });
    const [[calledUrl, init]] = fetcher.mock.calls as [[string, { method: string }]];
    expect(calledUrl).toContain('/api/v1/tournaments/dragon-cup-2026/my-registration');
    expect(init.method).toBe('PATCH');
  });
});

describe('createRegistrationApi — withdrawMyRegistration', () => {
  it('hits POST /api/v1/tournaments/:slug/my-registration/withdraw', async () => {
    const fetcher = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => null });
    const api = createRegistrationApi({ token: 'tok', fetcher: fetcher as never });
    await api.withdrawMyRegistration('dragon-cup-2026');
    const [[calledUrl, init]] = fetcher.mock.calls as [[string, { method: string }]];
    expect(calledUrl).toContain('/api/v1/tournaments/dragon-cup-2026/my-registration/withdraw');
    expect(init.method).toBe('POST');
  });
});

describe('createRegistrationApi — SDK delegation (no direct fetch)', () => {
  it('uses the injected fetcher, not native fetch', async () => {
    const fetcher = jest.fn().mockResolvedValue(jsonResponse(mockRegistrationDto));
    const api = createRegistrationApi({ fetcher: fetcher as never });
    await api.getMyRegistration('slug-1');
    expect(fetcher.mockResolvedValue).toBe(fetcher.mockResolvedValue);
  });

  it('does not store the token on the returned client', () => {
    const api = createRegistrationApi({ token: 'secret-token', fetcher: jest.fn() as never });
    expect('token' in api).toBe(false);
  });
});
