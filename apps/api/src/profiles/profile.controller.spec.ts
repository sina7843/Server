import { ProfileController } from './profile.controller';

const noAvatar = { resolveAvatarUrls: jest.fn().mockResolvedValue(undefined) };

describe('ProfileController', () => {
  it('returns public profile through profile service', async () => {
    const controller = new ProfileController(
      {
        getPublicProfileByUsername: jest.fn().mockResolvedValue({
          username: 'dragon',
          displayName: 'Dragon',
          visibility: 'public',
          publicUrl: '/u/dragon',
        }),
      } as never,
      noAvatar as never,
    );

    await expect(controller.getPublicProfile('Dragon')).resolves.toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });
  });

  it('returns private state without hidden fields', async () => {
    const controller = new ProfileController(
      {
        getPublicProfileByUsername: jest.fn().mockResolvedValue({
          state: 'private',
        }),
      } as never,
      noAvatar as never,
    );

    const response = await controller.getPublicProfile('private-user');

    expect(response).toEqual({ state: 'private' });
    expect(response).not.toHaveProperty('bio');
    expect(response).not.toHaveProperty('avatarMediaId');
    expect(response).not.toHaveProperty('displayName');
  });

  it('enriches public profile with avatarUrl when avatar resolves', async () => {
    const avatarService = {
      resolveAvatarUrls: jest.fn().mockResolvedValue({
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        avatarVariants: { thumbnail: 'https://cdn.example.com/avatar-thumb.jpg' },
      }),
    };

    const controller = new ProfileController(
      {
        getPublicProfileByUsername: jest.fn().mockResolvedValue({
          username: 'dragon',
          displayName: 'Dragon',
          avatarMediaId: 'media-id',
          visibility: 'public',
          publicUrl: '/u/dragon',
        }),
      } as never,
      avatarService as never,
    );

    const result = await controller.getPublicProfile('dragon');

    expect(result).toMatchObject({
      username: 'dragon',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
      avatarVariants: { thumbnail: 'https://cdn.example.com/avatar-thumb.jpg' },
    });
  });
});
