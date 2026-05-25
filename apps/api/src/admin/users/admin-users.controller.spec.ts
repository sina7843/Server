import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { parseAdminUsersQuery } from './dto/admin-user-query';
import { parseAdminUserStatusUpdate } from './dto/admin-user-status';

const MOCK_USER_ID = '64f000000000000000000001';
const MOCK_SESSION_ID = '64f000000000000000000002';

const mockListResponse = {
  users: [
    {
      id: MOCK_USER_ID,
      status: 'active',
      phoneMasked: '***01',
      phoneVerified: true,
      profile: { username: 'testuser', displayName: 'Test User', publicUrl: '/u/testuser' },
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

const mockDetailResponse = {
  user: {
    id: MOCK_USER_ID,
    status: 'active',
    phoneMasked: '***01',
    phoneVerified: true,
    profile: {
      username: 'testuser',
      displayName: 'Test User',
      visibility: 'public',
      publicUrl: '/u/testuser',
    },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
};

const mockSessionsResponse = {
  sessions: [
    {
      id: MOCK_SESSION_ID,
      deviceName: 'Chrome',
      expiresAt: '2025-12-31T00:00:00.000Z',
      createdAt: '2025-01-01T00:00:00.000Z',
      isActive: true,
    },
  ],
};

function createController() {
  const service = {
    listUsers: jest.fn().mockResolvedValue(mockListResponse),
    getUser: jest.fn().mockResolvedValue(mockDetailResponse),
    updateUserStatus: jest.fn().mockResolvedValue(mockDetailResponse),
    listUserSessions: jest.fn().mockResolvedValue(mockSessionsResponse),
    revokeUserSession: jest.fn().mockResolvedValue({ success: true, message: 'Session revoked.' }),
  };

  return { service, controller: new AdminUsersController(service as never) };
}

describe('AdminUsersController', () => {
  describe('GET /admin/v1/users', () => {
    it('lists users with default pagination', async () => {
      const { controller, service } = createController();
      const result = await controller.listUsers({});

      expect(service.listUsers).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(result.users).toHaveLength(1);
    });

    it('passes status filter', async () => {
      const { controller, service } = createController();
      await controller.listUsers({ status: 'active' });

      expect(service.listUsers).toHaveBeenCalledWith({ status: 'active', page: 1, limit: 20 });
    });

    it('rejects invalid status', () => {
      expect(() => parseAdminUsersQuery({ status: 'invalid' })).toThrow(BadRequestException);
    });

    it('rejects limit exceeding max', () => {
      expect(() => parseAdminUsersQuery({ limit: '200' })).toThrow(BadRequestException);
    });

    it('response does not contain passwordHash', async () => {
      const { controller } = createController();
      const result = await controller.listUsers({});

      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });

    it('response does not contain token or session secrets', async () => {
      const { controller } = createController();
      const result = await controller.listUsers({});

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('refreshTokenHash');
      expect(serialized).not.toContain('accessTokenJti');
    });
  });

  describe('GET /admin/v1/users/:id', () => {
    it('returns user detail', async () => {
      const { controller, service } = createController();
      const result = await controller.getUser(MOCK_USER_ID);

      expect(service.getUser).toHaveBeenCalledWith(MOCK_USER_ID);
      expect(result.user.id).toBe(MOCK_USER_ID);
    });

    it('response does not contain passwordHash or refreshTokenHash', async () => {
      const { controller } = createController();
      const result = await controller.getUser(MOCK_USER_ID);

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('refreshTokenHash');
    });
  });

  describe('PATCH /admin/v1/users/:id/status', () => {
    it('updates user status', async () => {
      const { controller, service } = createController();
      const req = { auth: { userId: 'admin-1' } } as never;
      await controller.updateUserStatus(MOCK_USER_ID, { status: 'suspended' }, req);

      expect(service.updateUserStatus).toHaveBeenCalledWith(
        MOCK_USER_ID,
        { status: 'suspended' },
        'admin-1',
      );
    });

    it('rejects invalid status', () => {
      expect(() => parseAdminUserStatusUpdate({ status: 'hard_deleted' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects pending_verification as an update target', () => {
      expect(() => parseAdminUserStatusUpdate({ status: 'pending_verification' })).toThrow(
        BadRequestException,
      );
    });

    it('accepts valid reason', () => {
      const dto = parseAdminUserStatusUpdate({ status: 'banned', reason: 'Terms violation' });

      expect(dto.status).toBe('banned');
      expect(dto.reason).toBe('Terms violation');
    });
  });

  describe('GET /admin/v1/users/:id/sessions', () => {
    it('lists sessions with safe fields only', async () => {
      const { controller, service } = createController();
      const result = await controller.listUserSessions(MOCK_USER_ID);

      expect(service.listUserSessions).toHaveBeenCalledWith(MOCK_USER_ID);

      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('refreshTokenHash');
    });
  });

  describe('DELETE /admin/v1/users/:id/sessions/:sessionId', () => {
    it('revokes session scoped to target user', async () => {
      const { controller, service } = createController();
      const req = { auth: { userId: 'admin-1' } } as never;
      const result = await controller.revokeUserSession(MOCK_USER_ID, MOCK_SESSION_ID, req);

      expect(service.revokeUserSession).toHaveBeenCalledWith(
        MOCK_USER_ID,
        MOCK_SESSION_ID,
        'admin-1',
      );
      expect(result.success).toBe(true);
    });
  });

  describe('security: no impersonation or bypass methods', () => {
    it('does not expose impersonate method', () => {
      const { controller } = createController();

      expect('impersonate' in controller).toBe(false);
    });

    it('does not expose resetPassword method', () => {
      const { controller } = createController();

      expect('resetPassword' in controller).toBe(false);
    });

    it('does not expose bypassPermission method', () => {
      const { controller } = createController();

      expect('bypassPermission' in controller).toBe(false);
    });
  });

  describe('NotFoundException handling', () => {
    it('service propagates not found for missing user', async () => {
      const { controller, service } = createController();
      service.getUser.mockRejectedValue(new NotFoundException('User not found.'));

      await expect(controller.getUser('64f000000000000000000099')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('ForbiddenException for permission denial', () => {
    it('service propagates forbidden when permission denied', async () => {
      const { controller, service } = createController();
      service.listUsers.mockRejectedValue(new ForbiddenException('Permission denied.'));

      await expect(controller.listUsers({})).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
