import type { Model } from 'mongoose';
import { SessionRepository } from './session.repository';
import type { SessionDocument } from './session.schema';
import { SessionSchema } from './session.schema';

const NOW = new Date('2026-01-01T00:00:00.000Z');

describe('SessionRepository', () => {
  function createRepository() {
    const exec = jest.fn().mockResolvedValue(null);
    const find = jest.fn().mockReturnValue({ exec });
    const findOne = jest.fn().mockReturnValue({ exec });
    const findByIdAndUpdate = jest.fn().mockReturnValue({ exec });
    const findOneAndUpdate = jest.fn().mockReturnValue({ exec });
    const updateMany = jest.fn().mockReturnValue({ exec });
    const create = jest.fn().mockResolvedValue({});
    const model = {
      create,
      find,
      findOne,
      findByIdAndUpdate,
      findOneAndUpdate,
      updateMany,
    } as unknown as Model<SessionDocument>;

    return {
      create,
      exec,
      find,
      findByIdAndUpdate,
      findOneAndUpdate,
      findOne,
      repository: new SessionRepository(model),
      updateMany,
    };
  }

  it('looks up sessions by refreshTokenHash using the hash only', async () => {
    const { findOne, repository } = createRepository();

    await repository.findByRefreshTokenHash('hashed-refresh-token');

    expect(findOne).toHaveBeenCalledWith({ refreshTokenHash: 'hashed-refresh-token' });
  });

  it('excludes revoked and expired sessions in active refresh token lookup', async () => {
    const { findOne, repository } = createRepository();

    await repository.findActiveByRefreshTokenHash('hashed-refresh-token', NOW);

    expect(findOne).toHaveBeenCalledWith({
      refreshTokenHash: 'hashed-refresh-token',
      revokedAt: { $exists: false },
      expiresAt: { $gt: NOW },
    });
  });

  it('excludes revoked and expired sessions in active user lookup', async () => {
    const { find, repository } = createRepository();

    await repository.findActiveByUserId('user-id', NOW);

    expect(find).toHaveBeenCalledWith({
      userId: 'user-id',
      revokedAt: { $exists: false },
      expiresAt: { $gt: NOW },
    });
  });

  it('lists sessions by current user id only', async () => {
    const { find, repository } = createRepository();

    await repository.findByUserId('user-id');

    expect(find).toHaveBeenCalledWith({ userId: 'user-id' });
  });

  it('finds a session by id and current user id', async () => {
    const { findOne, repository } = createRepository();

    await repository.findByIdAndUserId('session-id', 'user-id');

    expect(findOne).toHaveBeenCalledWith({ _id: 'session-id', userId: 'user-id' });
  });

  it('updates refreshTokenHash and accessTokenJti during rotation', async () => {
    const { findByIdAndUpdate, repository } = createRepository();

    await repository.updateRefreshTokenHash('session-id', 'new-hashed-refresh-token', 'new-jti');

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'session-id',
      {
        $set: {
          refreshTokenHash: 'new-hashed-refresh-token',
          accessTokenJti: 'new-jti',
        },
      },
      { new: true },
    );
  });

  it('touches lastUsedAt during refresh rotation', async () => {
    const { findByIdAndUpdate, repository } = createRepository();
    const lastUsedAt = new Date('2026-01-01T00:02:00.000Z');

    await repository.touchLastUsedAt('session-id', lastUsedAt);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'session-id',
      { $set: { lastUsedAt } },
      { new: true },
    );
  });

  it('sets revokedAt and revokedReason when revoking one session', async () => {
    const { findByIdAndUpdate, repository } = createRepository();
    const revokedAt = new Date('2026-01-01T00:01:00.000Z');

    await repository.revokeSession('session-id', 'logout', revokedAt);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'session-id',
      {
        $set: {
          revokedAt,
          revokedReason: 'logout',
        },
      },
      { new: true },
    );
  });

  it('revokes one current-user session by session id and user id', async () => {
    const { findOneAndUpdate, repository } = createRepository();
    const revokedAt = new Date('2026-01-01T00:01:00.000Z');

    await repository.revokeSessionForUser('session-id', 'user-id', 'user_revoked', revokedAt);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'session-id',
        userId: 'user-id',
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt,
          revokedReason: 'user_revoked',
        },
      },
      { new: true },
    );
  });

  it('revokes all sessions for one user by userId only', async () => {
    const { repository, updateMany } = createRepository();
    const revokedAt = new Date('2026-01-01T00:01:00.000Z');

    await repository.revokeAllForUser('user-id', 'logout_all', revokedAt);

    expect(updateMany).toHaveBeenCalledWith(
      {
        userId: 'user-id',
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt,
          revokedReason: 'logout_all',
        },
      },
    );
  });

  it('declares required schema indexes', () => {
    const indexes = SessionSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ userId: 1 }, expect.any(Object)],
        [{ refreshTokenHash: 1 }, expect.any(Object)],
        [{ expiresAt: 1 }, expect.any(Object)],
        [{ revokedAt: 1 }, expect.any(Object)],
      ]),
    );
  });
});
