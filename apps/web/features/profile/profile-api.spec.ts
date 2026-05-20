type WebTestFn = () => void | Promise<void>;

interface WebExpectMatchers {
  readonly not: WebExpectMatchers;
  readonly resolves: {
    toEqual(expected: unknown): Promise<void>;
  };
  readonly rejects: {
    toThrow(expected?: string): Promise<void>;
  };
  toBeNull(): void;
  toContain(expected: string): void;
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

import { createProfileApi } from './profile-api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('profile API helper', () => {
  it('uses SDK profile client to fetch public profile by username', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      jsonResponse({
        username: 'dragon',
        displayName: 'Dragon',
        visibility: 'public',
        publicUrl: '/u/dragon',
      }),
    );
    const api = createProfileApi({ fetcher: fetcher as never });

    await api.getPublicProfile('Dragon User');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/u/Dragon%20User', {
      method: 'GET',
      headers: {},
    });
  });

  it('handles private and not-found states', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ state: 'private' }))
      .mockResolvedValueOnce(jsonResponse({ state: 'not_found' }));
    const api = createProfileApi({ fetcher: fetcher as never });

    await expect(api.getPublicProfile('private-user')).resolves.toEqual({
      state: 'private',
    });
    await expect(api.getPublicProfile('missing-user')).resolves.toEqual({
      state: 'not_found',
    });
  });

  it('handles errors safely', async () => {
    const api = createProfileApi({
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 500)) as never,
    });

    await expect(api.getPublicProfile('dragon')).rejects.toThrow(
      'Request failed with status 500.',
    );
  });

  it('sends authenticated profile update payload without token storage', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      jsonResponse({
        username: 'dragon',
        displayName: 'Dragon',
        visibility: 'private',
        publicUrl: '/u/dragon',
      }),
    );
    const api = createProfileApi({ fetcher: fetcher as never, token: 'access-token' });

    await api.updateMyProfile({ visibility: 'private' });

    expect(fetcher).toHaveBeenCalledWith('/api/v1/me/profile', {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer access-token',
      },
      body: JSON.stringify({ visibility: 'private' }),
    });
    expect(api).not.toHaveProperty('token');
  });
});
