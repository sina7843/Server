import { ApiClientError, createAdminNotificationsClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
Object.assign(globalThis, { fetch: mockFetch });

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

function makeClient() {
  return createAdminNotificationsClient(
    createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
  );
}

describe('createAdminNotificationsClient', () => {
  describe('listNotificationLogs', () => {
    it('sends GET /admin/v1/system/notifications', async () => {
      mockJson({ items: [], page: 1, limit: 20, total: 0 });
      await makeClient().listNotificationLogs();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/v1/system/notifications'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('passes channel filter', async () => {
      mockJson({ items: [], page: 1, limit: 20, total: 0 });
      await makeClient().listNotificationLogs({ channel: 'sms' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('channel=sms'),
        expect.any(Object),
      );
    });

    it('passes status filter', async () => {
      mockJson({ items: [], page: 1, limit: 20, total: 0 });
      await makeClient().listNotificationLogs({ status: 'failed' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=failed'),
        expect.any(Object),
      );
    });

    it('passes recipientHash filter', async () => {
      mockJson({ items: [], page: 1, limit: 20, total: 0 });
      await makeClient().listNotificationLogs({ recipientHash: 'abc123' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('recipientHash=abc123'),
        expect.any(Object),
      );
    });

    it('throws ApiClientError on 403', async () => {
      mockJson({ message: 'Forbidden' }, 403);
      await expect(makeClient().listNotificationLogs()).rejects.toBeInstanceOf(ApiClientError);
    });

    it('response does not expose raw recipient or OTP', async () => {
      mockJson({
        items: [
          {
            id: '1',
            channel: 'sms',
            provider: 'mock',
            recipientMasked: '+98***7890',
            status: 'sent',
            createdAt: new Date().toISOString(),
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      });
      const result = await makeClient().listNotificationLogs();
      const serialized = JSON.stringify(result);
      expect(serialized).not.toMatch(/\d{6}/);
      expect(serialized).not.toContain('otp');
      expect(serialized).not.toContain('secret');
      expect(serialized).not.toContain('credential');
    });

    it('has no push, campaign, or notification-center methods', () => {
      const client = makeClient();
      expect('sendPushNotification' in client).toBe(false);
      expect('createCampaign' in client).toBe(false);
      expect('getNotificationCenter' in client).toBe(false);
    });

    it('has no mutation methods', () => {
      const client = makeClient();
      expect('deleteNotificationLog' in client).toBe(false);
      expect('updateNotificationLog' in client).toBe(false);
      expect('resendNotification' in client).toBe(false);
    });
  });

  describe('getNotificationLog', () => {
    it('sends GET /admin/v1/system/notifications/:id', async () => {
      mockJson({
        id: 'nlog-1',
        channel: 'sms',
        provider: 'mock',
        recipientMasked: '+98***7890',
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await makeClient().getNotificationLog('nlog-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/v1/system/notifications/nlog-1'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('response exposes recipientMasked but not raw recipient', async () => {
      const rawPhone = '+989123457890';
      mockJson({
        id: 'nlog-1',
        channel: 'sms',
        provider: 'mock',
        recipientMasked: '+98***7890',
        status: 'sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const result = await makeClient().getNotificationLog('nlog-1');
      const serialized = JSON.stringify(result);
      expect(result.recipientMasked).toBe('+98***7890');
      expect(serialized).not.toContain(rawPhone);
    });

    it('response does not expose raw OTP or provider credentials', async () => {
      mockJson({
        id: 'nlog-1',
        channel: 'sms',
        provider: 'mock',
        recipientMasked: '+98***7890',
        status: 'sent',
        providerMessageId: 'mock-abc123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const result = await makeClient().getNotificationLog('nlog-1');
      const serialized = JSON.stringify(result);
      expect(serialized).not.toMatch(/\d{6}/);
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('apiKey');
      expect(serialized).not.toContain('credential');
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not Found' }, 404);
      await expect(makeClient().getNotificationLog('nonexistent')).rejects.toBeInstanceOf(
        ApiClientError,
      );
    });
  });
});
