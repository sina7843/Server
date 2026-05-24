import { MeProfileController } from './me-profile.controller';

const noAvatar = { resolveAvatarUrls: jest.fn().mockResolvedValue(undefined) };

describe('MeProfileController', () => {
  it('ensures profile and returns own safe profile', async () => {
    const ensureProfileForVerifiedUser = jest.fn().mockResolvedValue({});
    const getMyProfile = jest.fn().mockResolvedValue({
      username: 'dragon',
      displayName: 'Dragon',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });
    const controller = new MeProfileController(
      { getMyProfile } as never,
      { ensureProfileForVerifiedUser } as never,
      noAvatar as never,
    );

    await expect(
      controller.getMyProfile({
        userId: 'user-1',
        sessionId: 'session-1',
        accessTokenJti: 'jti',
      }),
    ).resolves.toEqual({
      username: 'dragon',
      displayName: 'Dragon',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });

    expect(ensureProfileForVerifiedUser).toHaveBeenCalledWith('user-1');
  });

  it('validates and updates current user profile only', async () => {
    const updateMyProfile = jest.fn().mockResolvedValue({
      username: 'dragon-two',
      displayName: 'Dragon Two',
      visibility: 'private',
      publicUrl: '/u/dragon-two',
    });
    const controller = new MeProfileController(
      { updateMyProfile } as never,
      {} as never,
      noAvatar as never,
    );

    await controller.updateMyProfile(
      { userId: 'user-1', sessionId: 'session-1', accessTokenJti: 'jti' },
      {
        username: 'dragon-two',
        displayName: 'Dragon Two',
        visibility: 'private',
      },
    );

    expect(updateMyProfile).toHaveBeenCalledWith('user-1', {
      username: 'dragon-two',
      displayName: 'Dragon Two',
      visibility: 'private',
    });
  });

  it('enriches profile response with avatarUrl when avatar resolves', async () => {
    const avatarService = {
      resolveAvatarUrls: jest.fn().mockResolvedValue({
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
      }),
    };
    const controller = new MeProfileController(
      {
        getMyProfile: jest.fn().mockResolvedValue({
          username: 'dragon',
          displayName: 'Dragon',
          avatarMediaId: 'media-id',
          visibility: 'public',
          publicUrl: '/u/dragon',
        }),
      } as never,
      { ensureProfileForVerifiedUser: jest.fn().mockResolvedValue({}) } as never,
      avatarService as never,
    );

    const result = await controller.getMyProfile({
      userId: 'user-1',
      sessionId: 'session-1',
      accessTokenJti: 'jti',
    });

    expect(result).toMatchObject({
      username: 'dragon',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
    });
    expect(avatarService.resolveAvatarUrls).toHaveBeenCalledWith('media-id');
  });
});
