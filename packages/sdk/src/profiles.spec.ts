import { createProfilesClient } from './profiles';

describe('createProfilesClient', () => {
  it('builds getPublicProfile request', async () => {
    const get = jest.fn().mockResolvedValue({ state: 'not_found' });
    const client = createProfilesClient({ get, patch: jest.fn() });

    await client.getPublicProfile('Dragon User');

    expect(get).toHaveBeenCalledWith('/api/v1/u/Dragon%20User');
  });

  it('builds getMyProfile request', async () => {
    const get = jest.fn().mockResolvedValue({
      username: 'dragon',
      displayName: 'Dragon',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });
    const client = createProfilesClient({ get, patch: jest.fn() });

    await client.getMyProfile();

    expect(get).toHaveBeenCalledWith('/api/v1/me/profile');
  });

  it('builds updateMyProfile request without token storage', async () => {
    const patch = jest.fn().mockResolvedValue({
      username: 'dragon',
      displayName: 'Dragon',
      visibility: 'private',
      publicUrl: '/u/dragon',
    });
    const client = createProfilesClient({ get: jest.fn(), patch });

    await client.updateMyProfile({ visibility: 'private' });

    expect(patch).toHaveBeenCalledWith('/api/v1/me/profile', {
      visibility: 'private',
    });
    expect(client).not.toHaveProperty('token');
  });
});
