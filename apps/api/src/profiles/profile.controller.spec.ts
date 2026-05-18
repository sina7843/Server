import { ProfileController } from './profile.controller';

describe('ProfileController', () => {
  it('returns public profile through profile service', async () => {
    const controller = new ProfileController({
      getPublicProfileByUsername: jest.fn().mockResolvedValue({
        username: 'dragon',
        displayName: 'Dragon',
        visibility: 'public',
        publicUrl: '/u/dragon',
      }),
    } as never);

    await expect(controller.getPublicProfile('Dragon')).resolves.toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });
  });

  it('returns private state without hidden fields', async () => {
    const controller = new ProfileController({
      getPublicProfileByUsername: jest.fn().mockResolvedValue({
        state: 'private',
      }),
    } as never);

    const response = await controller.getPublicProfile('private-user');

    expect(response).toEqual({ state: 'private' });
    expect(response).not.toHaveProperty('bio');
    expect(response).not.toHaveProperty('avatarMediaId');
    expect(response).not.toHaveProperty('displayName');
  });
});
