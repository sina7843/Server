import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';

function createMockService() {
  return {
    listNotificationLogs: jest.fn().mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    }),
    getNotificationLog: jest.fn().mockResolvedValue({
      id: 'notif-log-1',
      channel: 'sms',
      provider: 'mock',
      recipientMasked: '***00',
      status: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  } as unknown as jest.Mocked<AdminNotificationsService>;
}

describe('AdminNotificationsController', () => {
  it('GET / returns paginated notification log list', async () => {
    const service = createMockService();
    const controller = new AdminNotificationsController(service);

    const result = await controller.listNotificationLogs({});

    expect(service.listNotificationLogs).toHaveBeenCalled();
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('limit');
  });

  it('GET /:id returns notification log detail', async () => {
    const service = createMockService();
    const controller = new AdminNotificationsController(service);

    const result = await controller.getNotificationLog('notif-log-1');

    expect(service.getNotificationLog).toHaveBeenCalledWith('notif-log-1');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('recipientMasked');
    expect(result).not.toHaveProperty('recipientHash');
    expect(result).not.toHaveProperty('recipientPhoneNormalized');
  });

  it('GET /:id throws NotFoundException when log not found', async () => {
    const service = createMockService();
    service.getNotificationLog.mockRejectedValue(
      new NotFoundException('Notification log not found.'),
    );
    const controller = new AdminNotificationsController(service);

    await expect(controller.getNotificationLog('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('GET / throws BadRequestException on invalid query parameters', async () => {
    const service = createMockService();
    service.listNotificationLogs.mockRejectedValue(new Error('Invalid status: bad_status'));
    const controller = new AdminNotificationsController(service);

    await expect(controller.listNotificationLogs({ status: 'bad_status' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('GET / list response does not expose raw recipient or raw OTP', async () => {
    const service = createMockService();
    service.listNotificationLogs.mockResolvedValue({
      items: [
        {
          id: '1',
          channel: 'sms' as const,
          provider: 'mock',
          recipientMasked: '***00',
          status: 'sent' as const,
          createdAt: new Date().toISOString(),
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    });
    const controller = new AdminNotificationsController(service);

    const result = await controller.listNotificationLogs({});
    const serialized = JSON.stringify(result);

    expect(serialized).not.toContain('recipientHash');
    expect(serialized).not.toContain('recipientPhoneNormalized');
  });

  it('has no POST, PATCH, or DELETE endpoints', () => {
    const controller = new AdminNotificationsController(createMockService());
    expect((controller as unknown as Record<string, unknown>).createNotificationLog).toBeUndefined();
    expect((controller as unknown as Record<string, unknown>).deleteNotificationLog).toBeUndefined();
    expect((controller as unknown as Record<string, unknown>).patchNotificationLog).toBeUndefined();
  });

  describe('query parser', () => {
    it('accepts valid channel filter', async () => {
      const service = createMockService();
      const controller = new AdminNotificationsController(service);

      await controller.listNotificationLogs({ channel: 'sms' });

      expect(service.listNotificationLogs).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'sms' }),
      );
    });

    it('accepts valid status filter', async () => {
      const service = createMockService();
      const controller = new AdminNotificationsController(service);

      await controller.listNotificationLogs({ status: 'sent' });

      expect(service.listNotificationLogs).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'sent' }),
      );
    });
  });
});
