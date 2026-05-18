import { createProfilesClient } from './profiles';

describe('createProfilesClient', () => {
  it('builds getPublicProfile request', async () => {
    const request = jest.fn().mockResolvedValue({ state: 'not_found' });
    const profiles = createProfilesClient({ request });

    await profiles.getPublicProfile('Dragon User');

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/v1/u/Dragon%20User',
    });
  });

  it('builds getMyProfile request', async () => {
    const request = jest.fn().mockResolvedValue({
      username: 'dragon',
      displayName: 'Dragon',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });
    const profiles = createProfilesClient({ request });

    await profiles.getMyProfile();

    expect(request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/api/v1/me/profile',
    });
  });

  it('builds updateMyProfile request without token storage', async () => {
    const request = jest.fn().mockResolvedValue({
      username: 'dragon',
      displayName: 'Dragon',
      visibility: 'private',
      publicUrl: '/u/dragon',
    });
    const profiles = createProfilesClient({ request });

    await profiles.updateMyProfile({ visibility: 'private' });

    expect(request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/api/v1/me/profile',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ visibility: 'private' }),
    });
    expect(profiles).not.toHaveProperty('token');
  });
});
