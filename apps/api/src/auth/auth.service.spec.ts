/* global describe, expect, it, jest */
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createAuthTestConfig } from '../../test/helpers/auth-test.factory';
import {
  REGISTER_GENERIC_MESSAGE,
  REVOKE_SESSION_GENERIC_MESSAGE,
  VERIFY_PHONE_GENERIC_MESSAGE,
} from './dto/auth-response.dto';
import { AuthService } from './auth.service';
import { createGenericAuthResponse } from './dto/auth-response.dto';
import { OtpChallengeRepository } from './otp/otp.repository';
import { OtpChallengeService } from './otp/otp.service';
import { hashOtpCode } from './security/otp-code';
import { hashPassword } from './security/password-hasher';
import { hashToken } from './security/token-hasher';
import { SessionRepository } from './sessions/session.repository';
import { SmsService } from './sms/sms.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { UserRepository } from './users/user.repository';
import { UserService } from './users/user.service';
import { UserProfileLifecycleService } from '../profiles/profile-lifecycle.service';

const VERIFIED_AT = new Date('2026-01-01T00:00:00.000Z');

describe('AuthService', () => {
  async function createService() {
    const userRepository = {
      findByPhoneNormalized: jest.fn(),
      findNonDeletedByPhoneNormalized: jest.fn(),
      findById: jest.fn(),
      createPendingUser: jest.fn().mockResolvedValue({ _id: 'user-1' }),
      markPhoneVerified: jest.fn().mockResolvedValue({ _id: 'user-1', status: 'active' }),
      incrementFailedLogin: jest.fn().mockResolvedValue({ _id: 'user-1' }),
      updateLoginSuccessMetadata: jest.fn().mockResolvedValue({ _id: 'user-1' }),
    } as unknown as jest.Mocked<UserRepository>;
    const userService = new UserService();
    const otpChallengeRepository = {
      findLatestActiveByPhoneAndPurpose: jest.fn().mockResolvedValue(null),
      createChallenge: jest.fn().mockResolvedValue({ _id: 'otp-1' }),
      incrementAttempts: jest.fn().mockResolvedValue({ _id: 'otp-1' }),
      markVerified: jest.fn().mockResolvedValue({ _id: 'otp-1' }),
      markConsumed: jest.fn().mockResolvedValue({ _id: 'otp-1' }),
      countRecentChallengesByPhone: jest.fn().mockResolvedValue(0),
      countRecentChallengesByIp: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<OtpChallengeRepository>;
    const otpChallengeService = new OtpChallengeService();
    const smsService = {
      sendSms: jest.fn().mockResolvedValue({
        provider: 'mock',
        status: 'sent',
        providerMessageId: 'mock-register',
      }),
      enqueueSms: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SmsService>;
    const sessionRepository = {
      createSession: jest.fn().mockResolvedValue({ _id: 'session-1' }),
      findActiveByRefreshTokenHash: jest.fn(),
      findActiveById: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      findByIdAndUserId: jest.fn(),
      updateRefreshTokenHash: jest.fn().mockResolvedValue({ _id: 'session-1' }),
      rotateRefreshTokenAtomically: jest.fn().mockResolvedValue({ _id: 'session-1' }),
      touchLastUsedAt: jest.fn().mockResolvedValue({ _id: 'session-1' }),
      revokeSession: jest.fn().mockResolvedValue({ _id: 'session-1', revokedAt: new Date() }),
      revokeSessionForUser: jest
        .fn()
        .mockResolvedValue({ _id: 'session-1', revokedAt: new Date() }),
      revokeAllForUser: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
    } as unknown as jest.Mocked<SessionRepository>;
    const accessTokenService = {
      createJti: jest.fn().mockReturnValue('access-jti-1'),
      issueAccessToken: jest.fn().mockReturnValue({
        accessToken: 'access-token',
        jti: 'access-jti-1',
        expiresIn: 900,
      }),
    } as unknown as jest.Mocked<AccessTokenService>;
    const refreshTokenService = {
      issueRefreshToken: jest.fn().mockReturnValue({
        refreshToken: 'raw-refresh-token',
        refreshTokenHash: 'hashed-refresh-token',
        expiresAt: new Date('2026-01-31T00:00:00.000Z'),
      }),
    } as unknown as jest.Mocked<RefreshTokenService>;
    const profileLifecycleService = {
      ensureProfileForActiveUser: jest.fn().mockResolvedValue({
        _id: 'profile-1',
        userId: 'user-1',
      }),
    } as unknown as jest.Mocked<UserProfileLifecycleService>;
    const service = new AuthService(
      userRepository,
      userService,
      otpChallengeRepository,
      otpChallengeService,
      smsService,
      createAuthTestConfig(),
      sessionRepository,
      accessTokenService,
      refreshTokenService,
      undefined,
      profileLifecycleService,
    );

    return {
      accessTokenService,
      otpChallengeRepository,
      profileLifecycleService,
      refreshTokenService,
      service,
      sessionRepository,
      smsService,
      userRepository,
    };
  }

  async function createActiveUser(overrides: Record<string, unknown> = {}) {
    return {
      _id: 'user-1',
      phoneNormalized: '+989120000000',
      phoneVerifiedAt: VERIFIED_AT,
      status: 'active',
      failedLoginCount: 0,
      passwordHash: await hashPassword('correct-password'),
      ...overrides,
    };
  }

  async function createChallenge(overrides: Record<string, unknown> = {}) {
    return {
      _id: 'otp-1',
      phoneNormalized: '+989120000000',
      purpose: 'phone_verification',
      codeHash: await hashOtpCode('123456'),
      expiresAt: new Date(Date.now() + 300_000),
      attempts: 0,
      maxAttempts: 5,
      ...overrides,
    };
  }

  function createPendingUser(overrides: Record<string, unknown> = {}) {
    return {
      _id: 'user-1',
      phoneNormalized: '+989120000000',
      status: 'pending_verification',
      failedLoginCount: 0,
      ...overrides,
    };
  }

  function createActiveSession(overrides: Record<string, unknown> = {}) {
    return {
      _id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: hashToken('current-refresh-token'),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ...overrides,
    };
  }

  describe('register', () => {
    it('creates a pending user when phone is new', async () => {
      const { service, userRepository } = await createService();
      userRepository.findByPhoneNormalized.mockResolvedValue(null);

      await service.register({ phone: '+98 912 000 0000', password: 'strong-pass' });

      expect(userRepository.createPendingUser).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+98 912 000 0000',
          phoneNormalized: '+989120000000',
        }),
      );
      expect(userRepository.createPendingUser).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: expect.stringContaining('$argon2') }),
      );
    });

    it('reuses a pending user idempotently without creating a duplicate user', async () => {
      const { service, userRepository } = await createService();
      userRepository.findByPhoneNormalized.mockResolvedValue({
        _id: 'user-1',
        status: 'pending_verification',
      } as never);

      await service.register({ phone: '+989120000000', password: 'strong-pass' });

      expect(userRepository.createPendingUser).not.toHaveBeenCalled();
    });

    it.each(['active', 'suspended', 'banned', 'deleted'] as const)(
      'returns generic response for existing %s user without sending OTP SMS',
      async (status) => {
        const { service, userRepository, otpChallengeRepository, smsService } =
          await createService();
        userRepository.findByPhoneNormalized.mockResolvedValue({ _id: 'user-1', status } as never);

        const response = await service.register({
          phone: '+989120000000',
          password: 'strong-pass',
        });

        expect(response).toEqual({
          success: true,
          message: REGISTER_GENERIC_MESSAGE,
        });
        expect(otpChallengeRepository.createChallenge).not.toHaveBeenCalled();
        expect(smsService.enqueueSms).not.toHaveBeenCalled();
      },
    );

    it('creates phone_verification OTP and sends SMS for a new pending user', async () => {
      const { service, userRepository, otpChallengeRepository, smsService } = await createService();
      userRepository.findByPhoneNormalized.mockResolvedValue(null);

      await service.register({ phone: '+989120000000', password: 'strong-pass' });

      expect(otpChallengeRepository.createChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNormalized: '+989120000000',
          purpose: 'phone_verification',
          codeHash: expect.stringContaining('$argon2id$'),
          maxAttempts: 5,
          expiresAt: expect.any(Date),
          nextResendAt: expect.any(Date),
        }),
      );
      expect(smsService.enqueueSms).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientPhoneNormalized: '+989120000000',
          purpose: 'phone_verification',
          message: expect.stringMatching(/\d{6}/),
        }),
      );
    });

    it('respects resend cooldown and does not send repeated SMS', async () => {
      const { service, userRepository, otpChallengeRepository, smsService } = await createService();
      userRepository.findByPhoneNormalized.mockResolvedValue({
        _id: 'user-1',
        status: 'pending_verification',
      } as never);
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue({
        nextResendAt: new Date(Date.now() + 60_000),
      } as never);

      await service.register({ phone: '+989120000000', password: 'strong-pass' });

      expect(otpChallengeRepository.createChallenge).not.toHaveBeenCalled();
      expect(smsService.enqueueSms).not.toHaveBeenCalled();
    });

    it('does not create or send OTP when phone daily limit is reached', async () => {
      const { service, userRepository, otpChallengeRepository, smsService } = await createService();
      userRepository.findByPhoneNormalized.mockResolvedValue(null);
      otpChallengeRepository.countRecentChallengesByPhone.mockResolvedValue(10);

      const response = await service.register(
        { phone: '+989120000000', password: 'strong-pass' },
        { ip: '203.0.113.10' },
      );

      expect(response).toEqual(createGenericAuthResponse());
      expect(otpChallengeRepository.createChallenge).not.toHaveBeenCalled();
      expect(smsService.enqueueSms).not.toHaveBeenCalled();
      expect(otpChallengeRepository.countRecentChallengesByPhone).toHaveBeenCalledWith(
        '+989120000000',
        'phone_verification',
        expect.any(Date),
      );
    });

    it('does not create or send OTP when IP limit is reached', async () => {
      const { service, userRepository, otpChallengeRepository, smsService } = await createService();
      userRepository.findByPhoneNormalized.mockResolvedValue(null);
      otpChallengeRepository.countRecentChallengesByIp.mockResolvedValue(30);

      const response = await service.register(
        { phone: '+989120000000', password: 'strong-pass' },
        { ip: '203.0.113.10' },
      );

      expect(response).toEqual(createGenericAuthResponse());
      expect(otpChallengeRepository.createChallenge).not.toHaveBeenCalled();
      expect(smsService.enqueueSms).not.toHaveBeenCalled();
      expect(otpChallengeRepository.countRecentChallengesByIp).toHaveBeenCalledWith(
        '203.0.113.10',
        'phone_verification',
        expect.any(Date),
      );
    });

    it('stores request metadata on OTP challenge when available', async () => {
      const { service, userRepository, otpChallengeRepository } = await createService();
      userRepository.findByPhoneNormalized.mockResolvedValue(null);

      await service.register(
        { phone: '+989120000000', password: 'strong-pass' },
        { ip: '203.0.113.10', userAgent: 'jest-agent', requestId: 'request-1' },
      );

      expect(otpChallengeRepository.createChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '203.0.113.10',
          userAgent: 'jest-agent',
          requestId: 'request-1',
        }),
      );
    });

    it('rejects passwords below the configured minimum length', async () => {
      const { service } = await createService();

      await expect(
        service.register({ phone: '+989120000000', password: 'short' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('verifyPhone', () => {
    it('succeeds for a pending user with valid OTP', async () => {
      const { service, userRepository, otpChallengeRepository } = await createService();
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        (await createChallenge()) as never,
      );
      userRepository.findByPhoneNormalized.mockResolvedValue(createPendingUser() as never);

      const response = await service.verifyPhone({ phone: '+989120000000', code: '123456' });

      expect(response).toEqual({
        success: true,
        message: VERIFY_PHONE_GENERIC_MESSAGE,
      });
      expect(otpChallengeRepository.markVerified).toHaveBeenCalledWith('otp-1', expect.any(Date));
      expect(otpChallengeRepository.markConsumed).toHaveBeenCalledWith('otp-1', expect.any(Date));
      expect(userRepository.markPhoneVerified).toHaveBeenCalledWith('user-1', expect.any(Date));
    });

    it('ensures profile after successful phone verification', async () => {
      const { service, userRepository, otpChallengeRepository, profileLifecycleService } =
        await createService();
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        (await createChallenge()) as never,
      );
      userRepository.findByPhoneNormalized.mockResolvedValue(createPendingUser() as never);

      await service.verifyPhone({ phone: '+989120000000', code: '123456' });

      expect(profileLifecycleService.ensureProfileForActiveUser).toHaveBeenCalledWith({
        userId: 'user-1',
      });
    });

    it('does not return token or session data after valid OTP', async () => {
      const { service, userRepository, otpChallengeRepository } = await createService();
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        (await createChallenge()) as never,
      );
      userRepository.findByPhoneNormalized.mockResolvedValue(createPendingUser() as never);

      const response = await service.verifyPhone({ phone: '+989120000000', code: '123456' });
      const serialized = JSON.stringify(response);

      expect(serialized).not.toContain('token');
      expect(serialized).not.toContain('session');
    });

    it('increments attempts and returns safe generic error for wrong OTP', async () => {
      const { service, otpChallengeRepository } = await createService();
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        (await createChallenge()) as never,
      );

      await expect(service.verifyPhone({ phone: '+989120000000', code: '000000' })).rejects.toThrow(
        'Phone verification could not be completed.',
      );

      expect(otpChallengeRepository.incrementAttempts).toHaveBeenCalledWith('otp-1');
    });

    it.each([
      { expiresAt: new Date(Date.now() - 1_000) },
      { consumedAt: new Date() },
      { attempts: 5, maxAttempts: 5 },
    ])('rejects invalid OTP state safely', async (overrides) => {
      const { service, otpChallengeRepository } = await createService();
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        (await createChallenge(overrides)) as never,
      );

      await expect(service.verifyPhone({ phone: '+989120000000', code: '123456' })).rejects.toThrow(
        'Phone verification could not be completed.',
      );
    });

    it.each(['active', 'suspended', 'banned', 'deleted'] as const)(
      'does not activate %s users through verify-phone',
      async (status) => {
        const { service, userRepository, otpChallengeRepository } = await createService();
        otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
          (await createChallenge()) as never,
        );
        userRepository.findByPhoneNormalized.mockResolvedValue(
          createPendingUser({ status }) as never,
        );

        await expect(
          service.verifyPhone({ phone: '+989120000000', code: '123456' }),
        ).rejects.toThrow('Phone verification could not be completed.');

        expect(userRepository.markPhoneVerified).not.toHaveBeenCalled();
      },
    );
  });

  describe('login', () => {
    it('allows an active verified user to login with the correct password', async () => {
      const { service, userRepository } = await createService();
      userRepository.findNonDeletedByPhoneNormalized.mockResolvedValue(
        (await createActiveUser()) as never,
      );

      const response = await service.login({
        phone: '+989120000000',
        password: 'correct-password',
      });

      expect(response).toEqual({
        accessToken: 'access-token',
        refreshToken: 'raw-refresh-token',
        refreshTokenExpiresAt: new Date('2026-01-31T00:00:00.000Z'),
        tokenType: 'Bearer',
        expiresIn: 900,
      });
    });

    it('creates a session with refreshTokenHash only and returns tokens safely', async () => {
      const { accessTokenService, service, sessionRepository, userRepository } =
        await createService();
      userRepository.findNonDeletedByPhoneNormalized.mockResolvedValue(
        (await createActiveUser()) as never,
      );

      const response = await service.login({
        phone: '+989120000000',
        password: 'correct-password',
        deviceId: 'device-1',
        deviceName: 'Test Device',
      });

      expect(sessionRepository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          refreshTokenHash: 'hashed-refresh-token',
          accessTokenJti: 'access-jti-1',
          deviceId: 'device-1',
          deviceName: 'Test Device',
          expiresAt: new Date('2026-01-31T00:00:00.000Z'),
        }),
      );
      expect(accessTokenService.issueAccessToken).toHaveBeenCalledWith({
        sub: 'user-1',
        jti: 'access-jti-1',
        sessionId: 'session-1',
      });
      expect(JSON.stringify(response)).not.toContain('refreshTokenHash');
      expect(JSON.stringify(response)).not.toContain('passwordHash');
      expect(JSON.stringify(response)).not.toContain('profile');
      expect(JSON.stringify(response)).not.toContain('roles');
      expect(JSON.stringify(response)).not.toContain('permissions');
    });

    it.each(['pending_verification', 'suspended', 'banned', 'deleted'] as const)(
      'rejects %s users safely',
      async (status) => {
        const { service, sessionRepository, userRepository } = await createService();
        userRepository.findNonDeletedByPhoneNormalized.mockResolvedValue(
          (await createActiveUser({ status })) as never,
        );

        await expect(
          service.login({ phone: '+989120000000', password: 'correct-password' }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
        expect(sessionRepository.createSession).not.toHaveBeenCalled();
      },
    );

    it('rejects unknown phone with a generic invalid credentials error', async () => {
      const { service, userRepository } = await createService();
      userRepository.findNonDeletedByPhoneNormalized.mockResolvedValue(null);

      await expect(
        service.login({ phone: '+989120000000', password: 'correct-password' }),
      ).rejects.toThrow('Invalid phone or password.');
    });

    it('wrong password increments failedLoginCount', async () => {
      const { service, userRepository } = await createService();
      userRepository.findNonDeletedByPhoneNormalized.mockResolvedValue(
        (await createActiveUser()) as never,
      );

      await expect(
        service.login({ phone: '+989120000000', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(userRepository.incrementFailedLogin).toHaveBeenCalledWith('user-1', undefined);
    });

    it('repeated wrong password can set lockedUntil', async () => {
      const { service, userRepository } = await createService();
      userRepository.findNonDeletedByPhoneNormalized.mockResolvedValue(
        (await createActiveUser({ failedLoginCount: 4 })) as never,
      );

      await expect(
        service.login({ phone: '+989120000000', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(userRepository.incrementFailedLogin).toHaveBeenCalledWith('user-1', expect.any(Date));
    });

    it('locked user cannot login', async () => {
      const { service, sessionRepository, userRepository } = await createService();
      userRepository.findNonDeletedByPhoneNormalized.mockResolvedValue(
        (await createActiveUser({ lockedUntil: new Date(Date.now() + 300_000) })) as never,
      );

      await expect(
        service.login({ phone: '+989120000000', password: 'correct-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(sessionRepository.createSession).not.toHaveBeenCalled();
    });

    it('successful login resets failedLoginCount and updates login metadata', async () => {
      const { service, userRepository } = await createService();
      userRepository.findNonDeletedByPhoneNormalized.mockResolvedValue(
        (await createActiveUser({ failedLoginCount: 3 })) as never,
      );

      await service.login(
        { phone: '+989120000000', password: 'correct-password' },
        { ip: '127.0.0.1', userAgent: 'test-agent' },
      );

      expect(userRepository.updateLoginSuccessMetadata).toHaveBeenCalledWith(
        'user-1',
        '127.0.0.1',
        expect.any(Date),
      );
    });
  });

  describe('refresh', () => {
    it('returns a new accessToken and refreshToken for a valid refresh token', async () => {
      const { service, sessionRepository, userRepository } = await createService();
      sessionRepository.findActiveByRefreshTokenHash.mockResolvedValue(
        createActiveSession() as never,
      );
      userRepository.findById.mockResolvedValue((await createActiveUser()) as never);

      const response = await service.refresh({ refreshToken: 'current-refresh-token' });

      expect(response).toEqual({
        accessToken: 'access-token',
        refreshToken: 'raw-refresh-token',
        refreshTokenExpiresAt: new Date('2026-01-31T00:00:00.000Z'),
        tokenType: 'Bearer',
        expiresIn: 900,
      });
    });

    it('rotates refreshTokenHash and does not return the hash', async () => {
      const { accessTokenService, service, sessionRepository, userRepository } =
        await createService();
      sessionRepository.findActiveByRefreshTokenHash.mockResolvedValue(
        createActiveSession() as never,
      );
      userRepository.findById.mockResolvedValue((await createActiveUser()) as never);

      const response = await service.refresh({ refreshToken: 'current-refresh-token' });

      expect(sessionRepository.findActiveByRefreshTokenHash).toHaveBeenCalledWith(
        hashToken('current-refresh-token'),
        expect.any(Date),
      );
      expect(sessionRepository.rotateRefreshTokenAtomically).toHaveBeenCalledWith({
        sessionId: 'session-1',
        currentRefreshTokenHash: hashToken('current-refresh-token'),
        nextRefreshTokenHash: 'hashed-refresh-token',
        nextAccessTokenJti: 'access-jti-1',
        now: expect.any(Date),
      });
      expect(accessTokenService.issueAccessToken).toHaveBeenCalledWith({
        sub: 'user-1',
        jti: 'access-jti-1',
        sessionId: 'session-1',
      });
      expect(JSON.stringify(response)).not.toContain('refreshTokenHash');
      expect(JSON.stringify(response)).not.toContain('passwordHash');
      expect(JSON.stringify(response)).not.toContain('roles');
      expect(JSON.stringify(response)).not.toContain('permissions');
      expect(JSON.stringify(response)).not.toContain('profile');
    });

    it('old refresh token no longer works after rotation', async () => {
      const { service, sessionRepository, userRepository } = await createService();
      sessionRepository.findActiveByRefreshTokenHash
        .mockResolvedValueOnce(createActiveSession() as never)
        .mockResolvedValueOnce(null);
      userRepository.findById.mockResolvedValue((await createActiveUser()) as never);

      await service.refresh({ refreshToken: 'current-refresh-token' });

      await expect(service.refresh({ refreshToken: 'current-refresh-token' })).rejects.toThrow(
        'Invalid refresh token.',
      );
    });

    it('updates session lastUsedAt atomically during rotation', async () => {
      const { service, sessionRepository, userRepository } = await createService();
      sessionRepository.findActiveByRefreshTokenHash.mockResolvedValue(
        createActiveSession() as never,
      );
      userRepository.findById.mockResolvedValue((await createActiveUser()) as never);

      await service.refresh({ refreshToken: 'current-refresh-token' });

      expect(sessionRepository.rotateRefreshTokenAtomically).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-1',
          now: expect.any(Date),
        }),
      );
    });

    it.each([{ expiresAt: new Date(Date.now() - 1_000) }, { revokedAt: new Date() }])(
      'rejects inactive sessions safely',
      async (overrides) => {
        const { service, sessionRepository } = await createService();
        sessionRepository.findActiveByRefreshTokenHash.mockResolvedValue(null);

        await expect(service.refresh({ refreshToken: 'current-refresh-token' })).rejects.toThrow(
          'Invalid refresh token.',
        );
        expect(overrides).toBeDefined();
      },
    );

    it('rejects stale refresh rotation when atomic update fails', async () => {
      const { service, sessionRepository, userRepository } = await createService();
      sessionRepository.findActiveByRefreshTokenHash.mockResolvedValue(
        createActiveSession() as never,
      );
      sessionRepository.rotateRefreshTokenAtomically.mockResolvedValue(null);
      userRepository.findById.mockResolvedValue((await createActiveUser()) as never);

      await expect(service.refresh({ refreshToken: 'current-refresh-token' })).rejects.toThrow(
        'Invalid refresh token.',
      );
    });

    it('rejects missing sessions safely', async () => {
      const { service, sessionRepository } = await createService();
      sessionRepository.findActiveByRefreshTokenHash.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: 'missing-refresh-token' })).rejects.toThrow(
        'Invalid refresh token.',
      );
    });

    it.each(['pending_verification', 'suspended', 'banned', 'deleted'] as const)(
      'rejects %s users safely',
      async (status) => {
        const { service, sessionRepository, userRepository } = await createService();
        sessionRepository.findActiveByRefreshTokenHash.mockResolvedValue(
          createActiveSession() as never,
        );
        userRepository.findById.mockResolvedValue((await createActiveUser({ status })) as never);

        await expect(service.refresh({ refreshToken: 'current-refresh-token' })).rejects.toThrow(
          'Invalid refresh token.',
        );
      },
    );
  });

  describe('logout', () => {
    it('revokes the current session with logout reason', async () => {
      const { service, sessionRepository } = await createService();
      sessionRepository.findActiveById.mockResolvedValue(createActiveSession() as never);

      const response = await service.logout({
        userId: 'user-1',
        sessionId: 'session-1',
        accessTokenJti: 'access-jti-1',
      });

      expect(sessionRepository.revokeSession).toHaveBeenCalledWith('session-1', 'logout');
      expect(response).toEqual({
        success: true,
        message: 'Logged out successfully.',
      });
    });

    it('fails safely when the current session is already revoked or missing', async () => {
      const { service, sessionRepository } = await createService();
      sessionRepository.findActiveById.mockResolvedValue(null);

      await expect(
        service.logout({
          userId: 'user-1',
          sessionId: 'session-1',
          accessTokenJti: 'access-jti-1',
        }),
      ).rejects.toThrow('Authentication is required.');
      expect(sessionRepository.revokeSession).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('revokes all current-user sessions with logout_all reason', async () => {
      const { service, sessionRepository } = await createService();

      const response = await service.logoutAll({
        userId: 'user-1',
        sessionId: 'session-1',
        accessTokenJti: 'access-jti-1',
      });

      expect(sessionRepository.revokeAllForUser).toHaveBeenCalledWith('user-1', 'logout_all');
      expect(response).toEqual({
        success: true,
        message: 'All sessions were logged out successfully.',
      });
    });
  });

  describe('getCurrentAuthIdentity', () => {
    it('returns minimal active user identity', async () => {
      const { service, userRepository } = await createService();
      userRepository.findById.mockResolvedValue((await createActiveUser()) as never);

      const response = await service.getCurrentAuthIdentity({
        userId: 'user-1',
        sessionId: 'session-1',
        accessTokenJti: 'access-jti-1',
      });

      expect(response).toEqual({
        user: {
          id: 'user-1',
          phoneVerified: true,
          status: 'active',
          phoneMasked: '***00',
        },
      });
      expect(JSON.stringify(response)).not.toContain('passwordHash');
      expect(JSON.stringify(response)).not.toContain('roles');
      expect(JSON.stringify(response)).not.toContain('permissions');
      expect(JSON.stringify(response)).not.toContain('profile');
      expect(JSON.stringify(response)).not.toContain('session');
      expect(JSON.stringify(response)).not.toContain('jti');
    });

    it.each(['pending_verification', 'suspended', 'banned', 'deleted'] as const)(
      'rejects %s users safely',
      async (status) => {
        const { service, userRepository } = await createService();
        userRepository.findById.mockResolvedValue((await createActiveUser({ status })) as never);

        await expect(
          service.getCurrentAuthIdentity({
            userId: 'user-1',
            sessionId: 'session-1',
            accessTokenJti: 'access-jti-1',
          }),
        ).rejects.toBeInstanceOf(UnauthorizedException);
      },
    );
  });

  describe('sessions', () => {
    it('lists only current user sessions as safe metadata', async () => {
      const { service, sessionRepository } = await createService();
      sessionRepository.findByUserId.mockResolvedValue([
        {
          _id: '507f1f77bcf86cd799439011',
          userId: 'user-1',
          refreshTokenHash: 'hidden-hash',
          accessTokenJti: 'hidden-jti',
          deviceName: 'Laptop',
          expiresAt: new Date('2026-02-01T00:00:00.000Z'),
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ] as never);

      const response = await service.listCurrentUserSessions({
        userId: 'user-1',
        sessionId: '507f1f77bcf86cd799439011',
        accessTokenJti: 'jti-1',
      });

      expect(sessionRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(response).toEqual({
        sessions: [
          {
            id: '507f1f77bcf86cd799439011',
            deviceName: 'Laptop',
            expiresAt: '2026-02-01T00:00:00.000Z',
            createdAt: '2026-01-01T00:00:00.000Z',
            isCurrent: true,
          },
        ],
      });
      expect(JSON.stringify(response)).not.toContain('refreshTokenHash');
      expect(JSON.stringify(response)).not.toContain('accessTokenJti');
      expect(JSON.stringify(response)).not.toContain('roles');
      expect(JSON.stringify(response)).not.toContain('permissions');
      expect(JSON.stringify(response)).not.toContain('profile');
    });

    it('revokes only a session owned by the current user', async () => {
      const { service, sessionRepository } = await createService();
      const sessionId = '507f1f77bcf86cd799439011';
      sessionRepository.findByIdAndUserId.mockResolvedValue({
        _id: sessionId,
        userId: 'user-1',
      } as never);

      const response = await service.revokeCurrentUserSession(
        { userId: 'user-1', sessionId: 'current-session', accessTokenJti: 'jti-1' },
        sessionId,
      );

      expect(sessionRepository.findByIdAndUserId).toHaveBeenCalledWith(sessionId, 'user-1');
      expect(sessionRepository.revokeSessionForUser).toHaveBeenCalledWith(
        sessionId,
        'user-1',
        'user_revoked',
      );
      expect(response).toEqual({ success: true, message: REVOKE_SESSION_GENERIC_MESSAGE });
    });

    it('does not revoke another user session when ownership lookup fails', async () => {
      const { service, sessionRepository } = await createService();
      const sessionId = '507f1f77bcf86cd799439011';
      sessionRepository.findByIdAndUserId.mockResolvedValue(null);

      const response = await service.revokeCurrentUserSession(
        { userId: 'user-1', sessionId: 'current-session', accessTokenJti: 'jti-1' },
        sessionId,
      );

      expect(sessionRepository.revokeSessionForUser).not.toHaveBeenCalled();
      expect(response).toEqual({ success: true, message: REVOKE_SESSION_GENERIC_MESSAGE });
    });

    it('handles invalid session id safely without revocation', async () => {
      const { service, sessionRepository } = await createService();

      const response = await service.revokeCurrentUserSession(
        { userId: 'user-1', sessionId: 'current-session', accessTokenJti: 'jti-1' },
        'not-a-valid-object-id',
      );

      expect(sessionRepository.findByIdAndUserId).not.toHaveBeenCalled();
      expect(sessionRepository.revokeSessionForUser).not.toHaveBeenCalled();
      expect(response).toEqual({ success: true, message: REVOKE_SESSION_GENERIC_MESSAGE });
    });
  });

  describe('audit hooks', () => {
    async function createServiceWithAudit() {
      const base = await createService();
      const auditLog = jest.fn().mockResolvedValue(undefined);
      const auditService = { log: auditLog } as never;
      const service = new AuthService(
        base.userRepository,
        new UserService(),
        base.otpChallengeRepository,
        new OtpChallengeService(),
        base.smsService,
        createAuthTestConfig(),
        base.sessionRepository,
        base.accessTokenService,
        base.refreshTokenService,
        undefined,
        base.profileLifecycleService,
        auditService,
      );
      return { ...base, service, auditLog };
    }

    it('register audits auth.register_requested without raw phone or password', async () => {
      const { service, userRepository, auditLog } = await createServiceWithAudit();
      userRepository.findByPhoneNormalized.mockResolvedValue(null);

      await service.register({ phone: '+989120000000', password: 'strong-pass' });

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'auth.register_requested', actorType: 'system' }),
      );
      const allArgs = JSON.stringify(auditLog.mock.calls);
      expect(allArgs).not.toContain('+989120000000');
      expect(allArgs).not.toContain('strong-pass');
    });

    it('register audits otp.created without raw OTP or code hash', async () => {
      const { service, userRepository, auditLog } = await createServiceWithAudit();
      userRepository.findByPhoneNormalized.mockResolvedValue(null);

      await service.register({ phone: '+989120000000', password: 'strong-pass' });

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'otp.created', actorType: 'system' }),
      );
      const allArgs = JSON.stringify(auditLog.mock.calls);
      expect(allArgs).not.toContain('codeHash');
      expect(allArgs).not.toContain('rawOtp');
    });

    it('register audits otp.rate_limited when daily phone limit is reached', async () => {
      const { service, userRepository, otpChallengeRepository, auditLog } =
        await createServiceWithAudit();
      userRepository.findByPhoneNormalized.mockResolvedValue(null);
      otpChallengeRepository.countRecentChallengesByPhone.mockResolvedValue(999);

      await service.register({ phone: '+989120000000', password: 'strong-pass' });

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'otp.rate_limited', severity: 'warning' }),
      );
    });

    it('verifyPhone audits otp.verified without raw OTP or phone', async () => {
      const { service, userRepository, otpChallengeRepository, auditLog } =
        await createServiceWithAudit();
      const challenge = await createChallenge();
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        challenge as never,
      );
      userRepository.findByPhoneNormalized.mockResolvedValue(
        createPendingUser({ status: 'pending_verification' }) as never,
      );

      await service.verifyPhone({ phone: '+989120000000', code: '123456' });

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'otp.verified', actorType: 'user' }),
      );
      const allArgs = JSON.stringify(auditLog.mock.calls);
      expect(allArgs).not.toContain('+989120000000');
      expect(allArgs).not.toContain('123456');
    });

    it('verifyPhone audits otp.failed on wrong code without raw OTP or phone', async () => {
      const { service, otpChallengeRepository, auditLog } = await createServiceWithAudit();
      const challenge = await createChallenge();
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        challenge as never,
      );

      await expect(
        service.verifyPhone({ phone: '+989120000000', code: 'wrong-code' }),
      ).rejects.toThrow();

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'otp.failed', severity: 'warning' }),
      );
      const allArgs = JSON.stringify(auditLog.mock.calls);
      expect(allArgs).not.toContain('+989120000000');
      expect(allArgs).not.toContain('wrong-code');
    });
  });
});
