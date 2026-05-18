import { UserProfileRepository } from './profile.repository';

const createModelMock = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  exists: jest.fn(),
});

describe('UserProfileRepository', () => {
  it('lookup uses usernameNormalized', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const model = createModelMock();

    model.findOne.mockReturnValue({ exec });

    const repository = new UserProfileRepository(model as never);

    await repository.findByUsernameNormalized('dragon');

    expect(model.findOne).toHaveBeenCalledWith({
      usernameNormalized: 'dragon',
    });
  });

  it('username availability is case-insensitive through usernameNormalized', async () => {
    const exec = jest.fn().mockResolvedValue(null);
    const model = createModelMock();

    model.exists.mockReturnValue({ exec });

    const repository = new UserProfileRepository(model as never);

    await expect(repository.isUsernameTaken('dragon')).resolves.toBe(false);
    expect(model.exists).toHaveBeenCalledWith({
      usernameNormalized: 'dragon',
    });
  });

  it('createProfile stores usernameNormalized and publicUrl', async () => {
    const model = createModelMock();

    model.create.mockResolvedValue({ _id: 'profile-id' });

    const repository = new UserProfileRepository(model as never);

    await repository.createProfile({
      userId: '64f000000000000000000001',
      username: 'Dragon',
      usernameNormalized: 'dragon',
      displayName: 'Dragon',
      visibility: 'public',
      publicUrl: '/u/dragon',
    });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'Dragon',
        usernameNormalized: 'dragon',
        publicUrl: '/u/dragon',
      }),
    );
  });
});
