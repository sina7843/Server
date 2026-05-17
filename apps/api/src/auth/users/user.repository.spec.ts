import type { Model } from 'mongoose';
import { UserRepository } from './user.repository';
import type { UserDocument } from './user.schema';
import { UserSchema } from './user.schema';

describe('UserRepository', () => {
  function createRepository() {
    const exec = jest.fn().mockResolvedValue(null);
    const findOne = jest.fn().mockReturnValue({ exec });
    const findById = jest.fn().mockReturnValue({ exec });
    const findByIdAndUpdate = jest.fn().mockReturnValue({ exec });
    const updateMany = jest.fn().mockReturnValue({ exec });
    const create = jest.fn().mockResolvedValue({});
    const model = {
      create,
      findOne,
      findById,
      findByIdAndUpdate,
      updateMany,
    } as unknown as Model<UserDocument>;

    return {
      create,
      exec,
      findById,
      findByIdAndUpdate,
      findOne,
      repository: new UserRepository(model),
      updateMany,
    };
  }

  it('uses phoneNormalized for direct phone lookup', async () => {
    const { findOne, repository } = createRepository();

    await repository.findByPhoneNormalized('+989120000000');

    expect(findOne).toHaveBeenCalledWith({ phoneNormalized: '+989120000000' });
  });

  it('loads users by id for token/session flows', async () => {
    const { findById, repository } = createRepository();

    await repository.findById('user-id');

    expect(findById).toHaveBeenCalledWith('user-id');
  });

  it('excludes deleted users in non-deleted phone lookup', async () => {
    const { findOne, repository } = createRepository();

    await repository.findNonDeletedByPhoneNormalized('+989120000000');

    expect(findOne).toHaveBeenCalledWith({
      phoneNormalized: '+989120000000',
      status: { $ne: 'deleted' },
      deletedAt: { $exists: false },
    });
  });

  it('uses active and non-deleted filters for active phone lookup', async () => {
    const { findOne, repository } = createRepository();

    await repository.findActiveByPhoneNormalized('+989120000000');

    expect(findOne).toHaveBeenCalledWith({
      phoneNormalized: '+989120000000',
      status: 'active',
      deletedAt: { $exists: false },
    });
  });

  it('creates pending users with a pending status and zero failed login count', async () => {
    const { create, repository } = createRepository();

    await repository.createPendingUser({
      phone: '+98 912 000 0000',
      phoneNormalized: '+989120000000',
      passwordHash: 'hashed-password-placeholder',
    });

    expect(create).toHaveBeenCalledWith({
      phone: '+98 912 000 0000',
      phoneNormalized: '+989120000000',
      email: undefined,
      emailNormalized: undefined,
      passwordHash: 'hashed-password-placeholder',
      metadata: undefined,
      status: 'pending_verification',
      failedLoginCount: 0,
    });
  });

  it('soft-deletes expired pending unverified users only', async () => {
    const { repository, updateMany } = createRepository();
    const cutoff = new Date('2026-01-01T00:00:00.000Z');
    const deletedAt = new Date('2026-01-02T00:00:00.000Z');

    await repository.markExpiredPendingUsersDeleted(cutoff, deletedAt);

    expect(updateMany).toHaveBeenCalledWith(
      {
        status: 'pending_verification',
        phoneVerifiedAt: { $exists: false },
        deletedAt: { $exists: false },
        createdAt: { $lt: cutoff },
      },
      {
        $set: {
          status: 'deleted',
          deletedAt,
          statusReason: 'pending_verification_expired',
        },
      },
    );
  });

  it('declares required schema indexes', () => {
    const indexes = UserSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ phoneNormalized: 1 }, expect.objectContaining({ unique: true })],
        [{ emailNormalized: 1 }, expect.objectContaining({ sparse: true, unique: true })],
        [{ status: 1 }, expect.any(Object)],
        [{ createdAt: 1 }, expect.any(Object)],
        [{ phoneVerifiedAt: 1 }, expect.any(Object)],
        [{ status: 1, createdAt: 1 }, expect.any(Object)],
      ]),
    );
  });
});
