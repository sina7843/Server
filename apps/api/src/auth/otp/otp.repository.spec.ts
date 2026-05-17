import type { Model } from 'mongoose';
import { OtpChallengeSchema, type OtpChallengeDocument } from './otp-challenge.schema';
import { OtpChallengeRepository } from './otp.repository';

const phoneNormalized = '+989120000000';
const purpose = 'phone_verification' as const;

describe('OtpChallengeRepository', () => {
  function createRepository() {
    const exec = jest.fn().mockResolvedValue(null);
    const sort = jest.fn().mockReturnValue({ exec });
    const create = jest.fn().mockResolvedValue({});
    const find = jest.fn().mockReturnValue({ sort });
    const findOne = jest.fn().mockReturnValue({ sort });
    const findByIdAndUpdate = jest.fn().mockReturnValue({ exec });
    const model = {
      create,
      find,
      findOne,
      findByIdAndUpdate,
    } as unknown as Model<OtpChallengeDocument>;

    return {
      create,
      exec,
      find,
      findByIdAndUpdate,
      findOne,
      repository: new OtpChallengeRepository(model),
      sort,
    };
  }

  it('creates challenges with a code hash and without a raw OTP code field', async () => {
    const { create, repository } = createRepository();
    const expiresAt = new Date('2026-01-01T00:05:00.000Z');

    await repository.createChallenge({
      phoneNormalized,
      purpose,
      codeHash: 'hashed-otp-placeholder',
      expiresAt,
      maxAttempts: 5,
    });

    expect(create).toHaveBeenCalledWith({
      phoneNormalized,
      purpose,
      codeHash: 'hashed-otp-placeholder',
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      resendCount: 0,
      nextResendAt: undefined,
      ip: undefined,
      userAgent: undefined,
      requestId: undefined,
    });
    expect(create).not.toHaveBeenCalledWith(expect.objectContaining({ code: expect.anything() }));
  });

  it('latest-active lookup filters by phoneNormalized and purpose', async () => {
    const { findOne, repository, sort } = createRepository();
    const now = new Date('2026-01-01T00:00:00.000Z');

    await repository.findLatestActiveByPhoneAndPurpose(phoneNormalized, purpose, now);

    expect(findOne).toHaveBeenCalledWith({
      phoneNormalized,
      purpose,
      consumedAt: { $exists: false },
      expiresAt: { $gt: now },
    });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('latest-active lookup excludes consumed and expired challenges', async () => {
    const { findOne, repository } = createRepository();
    const now = new Date('2026-01-01T00:00:00.000Z');

    await repository.findLatestActiveByPhoneAndPurpose(phoneNormalized, purpose, now);

    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        consumedAt: { $exists: false },
        expiresAt: { $gt: now },
      }),
    );
  });

  it('increments attempts through an atomic update', async () => {
    const { findByIdAndUpdate, repository } = createRepository();

    await repository.incrementAttempts('challenge-id');

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'challenge-id',
      { $inc: { attempts: 1 } },
      { new: true },
    );
  });

  it('marks challenges as verified and consumed without token generation', async () => {
    const { findByIdAndUpdate, repository } = createRepository();
    const verifiedAt = new Date('2026-01-01T00:01:00.000Z');
    const consumedAt = new Date('2026-01-01T00:02:00.000Z');

    await repository.markVerified('challenge-id', verifiedAt);
    await repository.markConsumed('challenge-id', consumedAt);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'challenge-id',
      { $set: { verifiedAt } },
      { new: true },
    );
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'challenge-id',
      { $set: { consumedAt } },
      { new: true },
    );
  });

  it('declares required schema indexes including expiresAt TTL', () => {
    const indexes = OtpChallengeSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ phoneNormalized: 1, purpose: 1, createdAt: -1 }, expect.any(Object)],
        [{ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 })],
        [{ phoneNormalized: 1, purpose: 1, consumedAt: 1 }, expect.any(Object)],
      ]),
    );
  });
});
