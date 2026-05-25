import { NotFoundException } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';

const VALID_USER_ID = '64f000000000000000000001';
const VALID_SESSION_ID = '64f000000000000000000002';

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: VALID_USER_ID,
    status: 'active',
    phoneNormalized: '+989120000000',
    failedLoginCount: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as never;
}

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    _id: VALID_SESSION_ID,
    userId: VALID_USER_ID,
    revokedAt: new Date(),
    ...overrides,
  } as never;
}

function makeRepositories(user: unknown = makeUser(), session: unknown = makeSession()) {
  return {
    userRepository: {
      findById: jest.fn().mockResolvedValue(user),
      updateStatus: jest.fn().mockResolvedValue(user),
    } as never,
    sessionRepository: {
      findByUserId: jest.fn().mockResolvedValue([session]),
      revokeSessionForUser: jest.fn().mockResolvedValue(session),
    } as never,
    profileRepository: {
      findByUserId: jest.fn().mockResolvedValue(null),
      findByUsernamePrefix: jest.fn().mockResolvedValue([]),
      findManyByUserIds: jest.fn().mockResolvedValue([]),
    } as never,
  };
}

interface MockAuditService {
  log: jest.Mock;
}

function makeAuditService(): MockAuditService {
  return { log: jest.fn().mockResolvedValue(undefined) };
}

describe('AdminUsersService audit hooks', () => {
  describe('updateUserStatus', () => {
    it('writes user.status_changed audit with before/after status', async () => {
      const { userRepository, sessionRepository, profileRepository } = makeRepositories(
        makeUser({ status: 'active' }),
      );
      const auditService = makeAuditService();
      const service = new AdminUsersService(
        userRepository,
        sessionRepository,
        profileRepository,
        auditService as never,
      );

      await service.updateUserStatus(VALID_USER_ID, { status: 'suspended' }, 'admin-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.status_changed',
          actorType: 'admin',
          actorId: 'admin-1',
          before: { status: 'active' },
          after: { status: 'suspended' },
        }),
      );
    });

    it('audit payload contains no phone or token', async () => {
      const { userRepository, sessionRepository, profileRepository } = makeRepositories();
      const auditService = makeAuditService();
      const service = new AdminUsersService(
        userRepository,
        sessionRepository,
        profileRepository,
        auditService as never,
      );

      await service.updateUserStatus(
        VALID_USER_ID,
        { status: 'banned', reason: 'Abuse' },
        'admin-1',
      );

      const allArgs = JSON.stringify(auditService.log.mock.calls);
      expect(allArgs).not.toContain('phoneNormalized');
      expect(allArgs).not.toContain('passwordHash');
      expect(allArgs).not.toContain('refreshTokenHash');
    });

    it('throws NotFoundException when user not found', async () => {
      const { userRepository, sessionRepository, profileRepository } = makeRepositories(null);
      const service = new AdminUsersService(userRepository, sessionRepository, profileRepository);

      await expect(
        service.updateUserStatus(VALID_USER_ID, { status: 'banned' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('revokeUserSession', () => {
    it('writes user.session_revoked audit with sessionId', async () => {
      const { userRepository, sessionRepository, profileRepository } = makeRepositories();
      const auditService = makeAuditService();
      const service = new AdminUsersService(
        userRepository,
        sessionRepository,
        profileRepository,
        auditService as never,
      );

      await service.revokeUserSession(VALID_USER_ID, VALID_SESSION_ID, 'admin-2');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.session_revoked',
          actorType: 'admin',
          actorId: 'admin-2',
          metadata: expect.objectContaining({ sessionId: VALID_SESSION_ID }),
        }),
      );
    });

    it('audit payload contains no phone or token in session revoke', async () => {
      const { userRepository, sessionRepository, profileRepository } = makeRepositories();
      const auditService = makeAuditService();
      const service = new AdminUsersService(
        userRepository,
        sessionRepository,
        profileRepository,
        auditService as never,
      );

      await service.revokeUserSession(VALID_USER_ID, VALID_SESSION_ID, 'admin-2');

      const allArgs = JSON.stringify(auditService.log.mock.calls);
      expect(allArgs).not.toContain('phoneNormalized');
      expect(allArgs).not.toContain('refreshTokenHash');
    });

    it('throws NotFoundException when session not found', async () => {
      const { userRepository, sessionRepository, profileRepository } = makeRepositories();
      (
        sessionRepository as { revokeSessionForUser: jest.Mock }
      ).revokeSessionForUser.mockResolvedValue(null);
      const service = new AdminUsersService(userRepository, sessionRepository, profileRepository);

      await expect(
        service.revokeUserSession(VALID_USER_ID, VALID_SESSION_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
