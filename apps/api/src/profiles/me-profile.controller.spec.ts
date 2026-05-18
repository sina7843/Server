import { MeProfileController } from './me-profile.controller';

describe('MeProfileController', () => {
  it('ensures profile and returns own safe profile', async () => {
    const ensureProfileForVerifiedUser = jest.fn().mockResolvedValue({});
    const controller = new MeProfileController(
      {
        getMyProfile: jest.fn().mockResolvedValue({
          username: 'dragon',
          displayName: 'Dragon',
          visibility: 'public',
          publicUrl: '/u/dragon',
        }),
      } as never,
      { ensureProfileForVerifiedUser } as never,
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
    const controller = new MeProfileController({ updateMyProfile } as never, {} as never);

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
});
