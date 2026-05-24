import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminAuditController } from './admin-audit.controller';
import { parseAdminAuditQuery } from './dto/admin-audit-query';

const MOCK_LOG_ID = '64f000000000000000000001';

const mockListResponse = {
  items: [
    {
      id: MOCK_LOG_ID,
      actorType: 'user',
      action: 'auth.login_success',
      resourceType: 'auth',
      severity: 'info',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
};

const mockDetailResponse = {
  id: MOCK_LOG_ID,
  actorType: 'user',
  actorId: '64f000000000000000000002',
  action: 'auth.login_success',
  resourceType: 'auth',
  severity: 'info',
  createdAt: '2025-01-01T00:00:00.000Z',
};

function createController() {
  const service = {
    listAuditLogs: jest.fn().mockResolvedValue(mockListResponse),
    getAuditLog: jest.fn().mockResolvedValue(mockDetailResponse),
  };

  return { service, controller: new AdminAuditController(service as never) };
}

describe('AdminAuditController', () => {
  describe('GET /admin/v1/audit-logs', () => {
    it('lists audit logs with default pagination', async () => {
      const { controller, service } = createController();
      const result = await controller.listAuditLogs({});

      expect(service.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
      expect(result.items).toHaveLength(1);
    });

    it('passes actorType filter', async () => {
      const { controller, service } = createController();
      await controller.listAuditLogs({ actorType: 'user' });

      expect(service.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ actorType: 'user' }) }),
      );
    });

    it('passes severity filter', async () => {
      const { controller, service } = createController();
      await controller.listAuditLogs({ severity: 'warning' });

      expect(service.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ severity: 'warning' }) }),
      );
    });

    it('passes date range filters', async () => {
      const { controller, service } = createController();
      await controller.listAuditLogs({ dateFrom: '2025-01-01', dateTo: '2025-12-31' });

      expect(service.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ dateFrom: expect.any(Date) }),
        }),
      );
    });

    it('passes requestId filter', async () => {
      const { controller, service } = createController();
      await controller.listAuditLogs({ requestId: 'req-abc-123' });

      expect(service.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ requestId: 'req-abc-123' }),
        }),
      );
    });

    it('passes correlationId filter', async () => {
      const { controller, service } = createController();
      await controller.listAuditLogs({ correlationId: 'corr-xyz' });

      expect(service.listAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ correlationId: 'corr-xyz' }),
        }),
      );
    });

    it('rejects invalid actorType', () => {
      expect(() => parseAdminAuditQuery({ actorType: 'robot' })).toThrow(BadRequestException);
    });

    it('rejects invalid severity', () => {
      expect(() => parseAdminAuditQuery({ severity: 'very_bad' })).toThrow(BadRequestException);
    });

    it('rejects invalid actorId', () => {
      expect(() => parseAdminAuditQuery({ actorId: 'not-an-objectid' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects invalid dateFrom', () => {
      expect(() => parseAdminAuditQuery({ dateFrom: 'not-a-date' })).toThrow(BadRequestException);
    });

    it('rejects dateFrom after dateTo', () => {
      expect(() => parseAdminAuditQuery({ dateFrom: '2025-12-31', dateTo: '2025-01-01' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects limit exceeding max', () => {
      expect(() => parseAdminAuditQuery({ limit: '9999' })).toThrow(BadRequestException);
    });

    it('caps pagination correctly', () => {
      const dto = parseAdminAuditQuery({ page: '3', limit: '50' });
      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(50);
    });

    it('response items do not contain password or passwordHash', async () => {
      const { controller } = createController();
      const result = await controller.listAuditLogs({});
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('passwordHash');
    });

    it('response items do not contain raw OTP or code', async () => {
      const { controller } = createController();
      const result = await controller.listAuditLogs({});
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('rawOtp');
      expect(serialized).not.toContain('"code"');
    });

    it('response items do not contain refreshToken or accessToken', async () => {
      const { controller } = createController();
      const result = await controller.listAuditLogs({});
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('refreshToken');
      expect(serialized).not.toContain('accessToken');
    });
  });

  describe('GET /admin/v1/audit-logs/:id', () => {
    it('returns audit log detail', async () => {
      const { controller, service } = createController();
      const result = await controller.getAuditLog(MOCK_LOG_ID);

      expect(service.getAuditLog).toHaveBeenCalledWith(MOCK_LOG_ID);
      expect(result.id).toBe(MOCK_LOG_ID);
    });

    it('propagates NotFoundException for missing log', async () => {
      const { controller, service } = createController();
      service.getAuditLog.mockRejectedValue(new NotFoundException('Audit log not found.'));

      await expect(controller.getAuditLog('64f000000000000000000099')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('detail response does not contain password or token secrets', async () => {
      const { controller } = createController();
      const result = await controller.getAuditLog(MOCK_LOG_ID);
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('refreshToken');
      expect(serialized).not.toContain('accessToken');
      expect(serialized).not.toContain('rawOtp');
    });
  });

  describe('append-only: no mutation endpoints', () => {
    it('does not expose createAuditLog method', () => {
      const { controller } = createController();
      expect('createAuditLog' in controller).toBe(false);
    });

    it('does not expose updateAuditLog method', () => {
      const { controller } = createController();
      expect('updateAuditLog' in controller).toBe(false);
    });

    it('does not expose deleteAuditLog method', () => {
      const { controller } = createController();
      expect('deleteAuditLog' in controller).toBe(false);
    });

    it('does not expose exportAuditLogs method', () => {
      const { controller } = createController();
      expect('exportAuditLogs' in controller).toBe(false);
    });
  });

  describe('security: permission propagation', () => {
    it('propagates ForbiddenException from service', async () => {
      const { controller, service } = createController();
      service.listAuditLogs.mockRejectedValue(new ForbiddenException('Permission denied.'));

      await expect(controller.listAuditLogs({})).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
