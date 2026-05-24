/* global describe, expect, it, jest */
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createAuthTestConfig } from '../../../test/helpers/auth-test.factory';
import { hashOtpCode } from '../security/otp-code';
import { verifyPassword } from '../security/password-hasher';
import { OtpChallengeRepository } from '../otp/otp.repository';
import { OtpChallengeService } from '../otp/otp.service';
import { SessionRepository } from '../sessions/session.repository';
import { SmsService } from '../sms/sms.service';
import { UserRepository } from '../users/user.repository';
import { UserService } from '../users/user.service';
import { PasswordResetService } from './password-reset.service';

const VERIFIED_AT = new Date('2026-01-01T00:00:00.000Z');

describe('PasswordResetService', () => {
  function createActiveUser(overrides: Record<string, unknown> = {}) {
    return {
      _id: 'user-1',
      phoneNormalized: '+989120000000',
      phoneVerifiedAt: VERIFIED_AT,
      status: 'active',
      failedLoginCount: 0,
      ...overrides,
    };
  }

  async function createChallenge(overrides: Record<string, unknown> = {}) {
    return {
      _id: 'otp-1',
      phoneNormalized: '+989120000000',
      purpose: 'password_reset',
      codeHash: await hashOtpCode('123456'),
      expiresAt: new Date(Date.now() + 300_000),
      attempts: 0,
      maxAttempts: 5,
      ...overrides,
    };
  }

  function createService() {
    const userRepository = {
      findActiveByPhoneNormalized: jest.fn(),
      findById: jest.fn(),
      updatePasswordHash: jest.fn().mockResolvedValue({ _id: 'user-1' }),
      resetFailedLoginState: jest.fn().mockResolvedValue({ _id: 'user-1' }),
    } as unknown as jest.Mocked<UserRepository>;
    const otpChallengeRepository = {
      findLatestActiveByPhoneAndPurpose: jest.fn().mockResolvedValue(null),
      createChallenge: jest.fn().mockResolvedValue({ _id: 'otp-1' }),
      incrementAttempts: jest.fn().mockResolvedValue({ _id: 'otp-1' }),
      markVerified: jest.fn().mockResolvedValue({ _id: 'otp-1' }),
      markConsumed: jest.fn().mockResolvedValue({ _id: 'otp-1' }),
      countRecentChallengesByPhone: jest.fn().mockResolvedValue(0),
      countRecentChallengesByIp: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<OtpChallengeRepository>;
    const smsService = {
      sendSms: jest.fn().mockResolvedValue({ provider: 'mock', status: 'sent' }),
      enqueueSms: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<SmsService>;
    const sessionRepository = {
      revokeAllForUser: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
    } as unknown as jest.Mocked<SessionRepository>;
    const service = new PasswordResetService(
      userRepository,
      new UserService(),
      otpChallengeRepository,
      new OtpChallengeService(),
      smsService,
      sessionRepository,
      createAuthTestConfig(),
    );

    return {
      otpChallengeRepository,
      service,
      sessionRepository,
      smsService,
      userRepository,
    };
  }

  describe('forgotPassword', () => {
    it('always returns generic success for unknown phone without revealing existence', async () => {
      const { service, userRepository, otpChallengeRepository, smsService } = createService();
      userRepository.findActiveByPhoneNormalized.mockResolvedValue(null);

      const response = await service.forgotPassword({ phone: '+989120000000' });

      expect(response.success).toBe(true);
      expect(otpChallengeRepository.createChallenge).not.toHaveBeenCalled();
      expect(smsService.enqueueSms).not.toHaveBeenCalled();
    });

    it('creates password_reset OTP only for active verified user and sends SMS', async () => {
      const { service, userRepository, otpChallengeRepository, smsService } = createService();
      userRepository.findActiveByPhoneNormalized.mockResolvedValue(createActiveUser() as never);

      await service.forgotPassword({ phone: '+98 912 000 0000' });

      expect(otpChallengeRepository.createChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          phoneNormalized: '+989120000000',
          purpose: 'password_reset',
          codeHash: expect.stringContaining('$argon2id$'),
        }),
      );
      expect(smsService.enqueueSms).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientPhoneNormalized: '+989120000000',
          purpose: 'password_reset',
          message: expect.stringMatching(/\d{6}/),
        }),
      );
    });

    it.each(['pending_verification', 'suspended', 'banned', 'deleted'] as const)(
      'does not create OTP for %s users',
      async (status) => {
        const { service, userRepository, otpChallengeRepository, smsService } = createService();
        userRepository.findActiveByPhoneNormalized.mockResolvedValue(
          createActiveUser({ status }) as never,
        );

        await service.forgotPassword({ phone: '+989120000000' });

        expect(otpChallengeRepository.createChallenge).not.toHaveBeenCalled();
        expect(smsService.enqueueSms).not.toHaveBeenCalled();
      },
    );
  });

  it('does not create or send reset OTP when phone daily limit is reached', async () => {
    const { service, userRepository, otpChallengeRepository, smsService } = createService();
    userRepository.findActiveByPhoneNormalized.mockResolvedValue(createActiveUser() as never);
    otpChallengeRepository.countRecentChallengesByPhone.mockResolvedValue(10);

    const response = await service.forgotPassword(
      { phone: '+989120000000' },
      { ip: '203.0.113.10' },
    );

    expect(response.success).toBe(true);
    expect(otpChallengeRepository.createChallenge).not.toHaveBeenCalled();
    expect(smsService.enqueueSms).not.toHaveBeenCalled();
  });

  it('does not create or send reset OTP when IP limit is reached', async () => {
    const { service, userRepository, otpChallengeRepository, smsService } = createService();
    userRepository.findActiveByPhoneNormalized.mockResolvedValue(createActiveUser() as never);
    otpChallengeRepository.countRecentChallengesByIp.mockResolvedValue(30);

    const response = await service.forgotPassword(
      { phone: '+989120000000' },
      { ip: '203.0.113.10' },
    );

    expect(response.success).toBe(true);
    expect(otpChallengeRepository.createChallenge).not.toHaveBeenCalled();
    expect(smsService.enqueueSms).not.toHaveBeenCalled();
  });

  it('stores request metadata on password_reset OTP challenge when available', async () => {
    const { service, userRepository, otpChallengeRepository } = createService();
    userRepository.findActiveByPhoneNormalized.mockResolvedValue(createActiveUser() as never);

    await service.forgotPassword(
      { phone: '+989120000000' },
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

  describe('verifyResetOtp', () => {
    it('returns reset token and consumes OTP for valid password_reset OTP', async () => {
      const { service, userRepository, otpChallengeRepository } = createService();
      userRepository.findActiveByPhoneNormalized.mockResolvedValue(createActiveUser() as never);
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        (await createChallenge()) as never,
      );

      const response = await service.verifyResetOtp({ phone: '+989120000000', code: '123456' });

      expect(response.resetToken).toEqual(expect.any(String));
      expect(otpChallengeRepository.markVerified).toHaveBeenCalledWith('otp-1', expect.any(Date));
      expect(otpChallengeRepository.markConsumed).toHaveBeenCalledWith('otp-1', expect.any(Date));
    });

    it('increments attempts and rejects wrong reset OTP', async () => {
      const { service, userRepository, otpChallengeRepository } = createService();
      userRepository.findActiveByPhoneNormalized.mockResolvedValue(createActiveUser() as never);
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        (await createChallenge()) as never,
      );

      await expect(
        service.verifyResetOtp({ phone: '+989120000000', code: '000000' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(otpChallengeRepository.incrementAttempts).toHaveBeenCalledWith('otp-1');
    });

    it('rejects expired, consumed, or max-attempt OTP safely', async () => {
      const { service, otpChallengeRepository } = createService();
      otpChallengeRepository.findLatestActiveByPhoneAndPurpose.mockResolvedValue(
        (await createChallenge({ attempts: 5, maxAttempts: 5 })) as never,
      );

      await expect(
        service.verifyResetOtp({ phone: '+989120000000', code: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('updates passwordHash and revokes all user sessions', async () => {
      const { service, userRepository, sessionRepository } = createService();
      const user = createActiveUser();
      userRepository.findById.mockResolvedValue(user as never);
      const resetToken = service.issueResetToken('user-1');
      await service.resetPassword({ resetToken, newPassword: 'new-strong-password' });

      expect(userRepository.updatePasswordHash).toHaveBeenCalledWith(
        'user-1',
        expect.stringContaining('$argon2'),
      );
      expect(userRepository.resetFailedLoginState).toHaveBeenCalledWith('user-1');
      expect(sessionRepository.revokeAllForUser).toHaveBeenCalledWith('user-1', 'password_reset');
    });

    it('reset token has password_reset purpose and rejects invalid tokens', () => {
      const { service } = createService();
      const resetToken = service.issueResetToken('user-1');
      const claims = service.verifyResetToken(resetToken);

      expect(claims).toEqual(expect.objectContaining({ sub: 'user-1', purpose: 'password_reset' }));
      expect(() => service.verifyResetToken(`${resetToken}tampered`)).toThrow(
        UnauthorizedException,
      );
    });

    it('changes password so old password no longer verifies and new password verifies', async () => {
      const { service, userRepository } = createService();
      userRepository.findById.mockResolvedValue(createActiveUser() as never);
      const resetToken = service.issueResetToken('user-1');

      await service.resetPassword({ resetToken, newPassword: 'new-strong-password' });
      const passwordHash = userRepository.updatePasswordHash.mock.calls[0]?.[1];

      expect(passwordHash).toBeDefined();
      await expect(verifyPassword('new-strong-password', passwordHash as string)).resolves.toBe(
        true,
      );
      await expect(verifyPassword('old-password', passwordHash as string)).resolves.toBe(false);
    });
  });
});
