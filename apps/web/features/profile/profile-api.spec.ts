import { createProfileApi } from './profile-api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}
describe('profile API helper', () => {
  it('fetches public profile by username', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      jsonResponse({
        username: 'dragon',
        displayName: 'Dragon',
        visibility: 'public',
        publicUrl: '/u/dragon',
      }),
    );
    const api = createProfileApi({ fetcher });

    await api.getPublicProfile('Dragon User');

    expect(fetcher).toHaveBeenCalledWith('/api/v1/u/Dragon%20User', {
      headers: undefined,
    });
  });

  it('handles private and not-found states', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ state: 'private' }))
      .mockResolvedValueOnce(jsonResponse({ state: 'not_found' }));
    const api = createProfileApi({ fetcher });

    await expect(api.getPublicProfile('private-user')).resolves.toEqual({
      state: 'private',
    });
    await expect(api.getPublicProfile('missing-user')).resolves.toEqual({
      state: 'not_found',
    });
  });

  it('handles errors safely', async () => {
    const api = createProfileApi({
      fetcher: jest.fn().mockResolvedValue(jsonResponse({}, 500)),
    });

    await expect(api.getPublicProfile('dragon')).rejects.toThrow(
      'Profile request failed',
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
    const api = createProfileApi({ fetcher, token: 'access-token' });

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
