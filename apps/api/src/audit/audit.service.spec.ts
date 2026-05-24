import { AuditService } from './audit.service';
import { AuditLogRepository } from './audit-log.repository';
import { AuditRedactor } from './audit-redactor';

function makeService() {
  const create = jest.fn().mockResolvedValue({ _id: 'audit-1' });
  const findById = jest.fn().mockResolvedValue(null);
  const repository = { create, findById } as unknown as AuditLogRepository;
  const redactor = new AuditRedactor();
  const service = new AuditService(repository, redactor);

  return { service, create, repository, redactor };
}

describe('AuditService', () => {
  describe('log()', () => {
    it('writes an audit entry to the repository', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'user',
        action: 'auth.login_success',
        resourceType: 'auth',
        resourceId: 'user-123',
        severity: 'info',
      });

      expect(create).toHaveBeenCalledTimes(1);
    });

    it('passes action, resourceType, actorType to repository', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'admin',
        action: 'rbac.role_created',
        resourceType: 'role',
        resourceId: 'role-abc',
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorType: 'admin',
          action: 'rbac.role_created',
          resourceType: 'role',
          resourceId: 'role-abc',
        }),
      );
    });

    it('supports actor metadata (actorId, actorType)', async () => {
      const { service, create } = makeService();

      await service.log({
        actorId: '507f1f77bcf86cd799439011',
        actorType: 'user',
        action: 'profile.updated',
        resourceType: 'profile',
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: '507f1f77bcf86cd799439011',
          actorType: 'user',
        }),
      );
    });

    it('supports requestId and correlationId metadata', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'user',
        action: 'auth.login_success',
        resourceType: 'auth',
        requestId: 'req-abc',
        correlationId: 'corr-xyz',
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ requestId: 'req-abc', correlationId: 'corr-xyz' }),
      );
    });

    it('supports ip and userAgent metadata', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'user',
        action: 'auth.login_success',
        resourceType: 'auth',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ ip: '192.168.1.1', userAgent: 'Mozilla/5.0' }),
      );
    });

    it('redacts password from before/after before persistence', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'system',
        action: 'user.status_changed',
        resourceType: 'user',
        before: { status: 'active', password: 'should-be-redacted' },
        after: { status: 'locked', password: 'also-redacted' },
      });

      const called = create.mock.calls[0][0] as Record<string, unknown>;
      const before = called['before'] as Record<string, unknown>;
      const after = called['after'] as Record<string, unknown>;
      expect(before['password']).toBe('[REDACTED]');
      expect(after['password']).toBe('[REDACTED]');
      expect(before['status']).toBe('active');
      expect(after['status']).toBe('locked');
    });

    it('redacts passwordHash from metadata', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'system',
        action: 'auth.register_requested',
        resourceType: 'auth',
        metadata: { passwordHash: '$2b$10$abc', userId: 'u1' },
      });

      const called = create.mock.calls[0][0] as Record<string, unknown>;
      const metadata = called['metadata'] as Record<string, unknown>;
      expect(metadata['passwordHash']).toBe('[REDACTED]');
      expect(metadata['userId']).toBe('u1');
    });

    it('redacts refreshToken from before payload', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'user',
        action: 'auth.logout',
        resourceType: 'auth',
        before: { refreshToken: 'tok123', sessionId: 'sess-1' },
      });

      const called = create.mock.calls[0][0] as Record<string, unknown>;
      const before = called['before'] as Record<string, unknown>;
      expect(before['refreshToken']).toBe('[REDACTED]');
      expect(before['sessionId']).toBe('sess-1');
    });

    it('redacts otp/code from metadata before persistence', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'user',
        action: 'otp.created',
        resourceType: 'auth',
        metadata: { otp: '123456', code: '654321', phone: '+989001234567' },
      });

      const called = create.mock.calls[0][0] as Record<string, unknown>;
      const metadata = called['metadata'] as Record<string, unknown>;
      expect(metadata['otp']).toBe('[REDACTED]');
      expect(metadata['code']).toBe('[REDACTED]');
      expect(metadata['phone']).toBe('+989001234567');
    });

    it('does not write secrets from raw OTPs in any payload', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'user',
        action: 'otp.verified',
        resourceType: 'auth',
        metadata: { rawOtp: 'raw-secret', codeHash: 'hash' },
      });

      const called = create.mock.calls[0][0] as Record<string, unknown>;
      const metadata = called['metadata'] as Record<string, unknown>;
      expect(metadata['rawOtp']).toBe('[REDACTED]');
      expect(metadata['codeHash']).toBe('[REDACTED]');
    });

    it('handles audit write failure safely without rethrowing', async () => {
      const create = jest.fn().mockRejectedValue(new Error('DB connection lost'));
      const repository = { create, findById: jest.fn() } as unknown as AuditLogRepository;
      const service = new AuditService(repository, new AuditRedactor());

      await expect(
        service.log({
          actorType: 'user',
          action: 'auth.login_success',
          resourceType: 'auth',
        }),
      ).resolves.toBeUndefined();
    });

    it('does not let audit write failure propagate to callers', async () => {
      const create = jest.fn().mockRejectedValue(new Error('Disk full'));
      const repository = { create, findById: jest.fn() } as unknown as AuditLogRepository;
      const service = new AuditService(repository, new AuditRedactor());

      let threw = false;
      try {
        await service.log({
          actorType: 'system',
          action: 'media.asset_uploaded',
          resourceType: 'media_asset',
        });
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
    });

    it('defaults severity to info when not specified', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'user',
        action: 'auth.login_success',
        resourceType: 'auth',
      });

      expect(create).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }));
    });

    it('writes warning severity for login failures', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'user',
        action: 'auth.login_failed',
        resourceType: 'auth',
        severity: 'warning',
      });

      expect(create).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warning' }));
    });

    it('does not store raw secrets in any test audit payloads', async () => {
      const { service, create } = makeService();

      await service.log({
        actorType: 'system',
        action: 'auth.register_requested',
        resourceType: 'auth',
        metadata: {
          secret: 'raw-secret-value',
          providerCredentials: { key: 'cred' },
          authorization: 'Bearer xyz',
        },
      });

      const called = create.mock.calls[0][0] as Record<string, unknown>;
      const metadata = called['metadata'] as Record<string, unknown>;
      expect(metadata['secret']).toBe('[REDACTED]');
      expect(metadata['providerCredentials']).toBe('[REDACTED]');
      expect(metadata['authorization']).toBe('[REDACTED]');
    });
  });
});
