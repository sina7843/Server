import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminNotificationsService } from './admin-notifications.service';

const VALID_ID = '64f000000000000000000001';

function makeLog(overrides: Record<string, unknown> = {}) {
  return {
    _id: VALID_ID,
    id: VALID_ID,
    channel: 'sms',
    provider: 'mock',
    recipientMasked: '***00',
    status: 'sent',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

interface MockNotificationService {
  listLogs: jest.Mock;
  getLog: jest.Mock;
}

function makeNotificationService(log: unknown = makeLog()): MockNotificationService {
  return {
    listLogs: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getLog: jest.fn().mockResolvedValue(log),
  };
}

function makeService(mock: MockNotificationService): AdminNotificationsService {
  return new AdminNotificationsService(mock as never);
}

describe('AdminNotificationsService.getNotificationLog', () => {
  it('returns DTO for existing log', async () => {
    const notificationService = makeNotificationService();
    const service = makeService(notificationService);

    const result = await service.getNotificationLog(VALID_ID);

    expect(result).toBeDefined();
    expect(notificationService.getLog).toHaveBeenCalledWith(VALID_ID);
  });

  it('throws NotFoundException for valid but missing ObjectId', async () => {
    const notificationService = makeNotificationService(null);
    const service = makeService(notificationService);

    await expect(service.getNotificationLog(VALID_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException for invalid ObjectId', async () => {
    const notificationService = makeNotificationService();
    const service = makeService(notificationService);

    await expect(service.getNotificationLog('not-an-object-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(notificationService.getLog).not.toHaveBeenCalled();
  });

  it('throws BadRequestException for empty string id', async () => {
    const notificationService = makeNotificationService();
    const service = makeService(notificationService);

    await expect(service.getNotificationLog('')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException for SQL-injection-style id', async () => {
    const notificationService = makeNotificationService();
    const service = makeService(notificationService);

    await expect(service.getNotificationLog("' OR 1=1 --")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
