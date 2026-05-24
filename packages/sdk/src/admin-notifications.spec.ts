import { createAdminNotificationsClient } from './admin-notifications';

function createMockClient() {
  const request = jest.fn();
  const client = createAdminNotificationsClient({ request } as never);
  return { request, client };
}

describe('createAdminNotificationsClient', () => {
  describe('listNotificationLogs', () => {
    it('calls GET /admin/v1/system/notifications with no params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listNotificationLogs();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/system/notifications' }),
      );
    });

    it('passes channel filter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listNotificationLogs({ channel: 'sms' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/admin/v1/system/notifications?channel=sms' }),
      );
    });

    it('passes status filter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listNotificationLogs({ status: 'failed' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/admin/v1/system/notifications?status=failed' }),
      );
    });

    it('passes provider and templateKey filters', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listNotificationLogs({ provider: 'mock', templateKey: 'otp.sms' });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('provider=mock');
      expect(callArg.path).toContain('templateKey=otp.sms');
    });

    it('passes recipientHash filter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listNotificationLogs({ recipientHash: 'abc123hash' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/admin/v1/system/notifications?recipientHash=abc123hash',
        }),
      );
    });

    it('passes pagination params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 2, limit: 10, total: 0 });
      await client.listNotificationLogs({ page: 2, limit: 10 });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('page=2');
      expect(callArg.path).toContain('limit=10');
    });

    it('passes date range filters', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listNotificationLogs({ dateFrom: '2025-01-01', dateTo: '2025-12-31' });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('dateFrom=2025-01-01');
      expect(callArg.path).toContain('dateTo=2025-12-31');
    });

    it('does not expose push, campaign, or notification center methods', () => {
      const { client } = createMockClient();
      expect('sendPushNotification' in client).toBe(false);
      expect('createCampaign' in client).toBe(false);
      expect('getNotificationCenter' in client).toBe(false);
      expect('subscribe' in client).toBe(false);
    });

    it('does not expose mutation methods', () => {
      const { client } = createMockClient();
      expect('deleteNotificationLog' in client).toBe(false);
      expect('updateNotificationLog' in client).toBe(false);
      expect('createNotificationLog' in client).toBe(false);
    });
  });

  describe('getNotificationLog', () => {
    it('calls GET /admin/v1/system/notifications/:id', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ id: '64f000000000000000000001' });
      await client.getNotificationLog('64f000000000000000000001');
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          path: '/admin/v1/system/notifications/64f000000000000000000001',
        }),
      );
    });

    it('URL-encodes the id', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ id: 'abc' });
      await client.getNotificationLog('abc/def');
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toBe('/admin/v1/system/notifications/abc%2Fdef');
    });
  });
});
