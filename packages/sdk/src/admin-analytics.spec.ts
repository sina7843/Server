import { createAdminAnalyticsClient } from './admin-analytics';

function createMockClient() {
  const request = jest.fn();
  const client = createAdminAnalyticsClient({ request } as never);
  return { request, client };
}

const emptySummary = {
  registrations: 0,
  logins: 0,
  otpRequested: 0,
  contentViews: 0,
  contentPublished: 0,
  mediaUploads: 0,
};
const emptyContentTop = { views: 0, published: 0, top: [] };
const emptyAuth = { registrations: 0, logins: 0 };
const emptyOtp = { requested: 0, verified: 0, failed: 0 };
const emptyMedia = { uploads: 0 };

describe('createAdminAnalyticsClient', () => {
  describe('getSummary', () => {
    it('calls GET /admin/v1/analytics/summary with no params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptySummary);
      await client.getSummary();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/analytics/summary' }),
      );
    });

    it('passes dateFrom and dateTo params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptySummary);
      await client.getSummary({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('dateFrom=2026-01-01');
      expect(callArg.path).toContain('dateTo=2026-01-31');
    });

    it('returns summary DTO without raw IP or sensitive data', async () => {
      const { request, client } = createMockClient();
      const summary = { ...emptySummary, registrations: 5, logins: 10 };
      request.mockResolvedValue(summary);
      const result = await client.getSummary();
      expect(result.registrations).toBe(5);
      expect(result.logins).toBe(10);
      expect(result).not.toHaveProperty('ip');
      expect(result).not.toHaveProperty('phone');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });

  describe('getContentTop', () => {
    it('calls GET /admin/v1/analytics/content/top', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyContentTop);
      await client.getContentTop();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/analytics/content/top' }),
      );
    });

    it('passes date range params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyContentTop);
      await client.getContentTop({ dateFrom: '2026-01-01' });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('dateFrom=2026-01-01');
    });

    it('result top items have resourceId and views', async () => {
      const { request, client } = createMockClient();
      const result = {
        views: 100,
        published: 5,
        top: [{ resourceId: '64f000000000000000000001', views: 42, type: 'news' }],
      };
      request.mockResolvedValue(result);
      const data = await client.getContentTop();
      expect(data.top[0]?.resourceId).toBe('64f000000000000000000001');
      expect(data.top[0]?.views).toBe(42);
      expect(data.top[0]).not.toHaveProperty('objectKey');
      expect(data.top[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('getAuth', () => {
    it('calls GET /admin/v1/analytics/auth', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyAuth);
      await client.getAuth();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/analytics/auth' }),
      );
    });

    it('returns auth summary with registrations and logins', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ registrations: 3, logins: 7 });
      const result = await client.getAuth();
      expect(result.registrations).toBe(3);
      expect(result.logins).toBe(7);
      expect(result).not.toHaveProperty('phone');
      expect(result).not.toHaveProperty('otp');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('getOtp', () => {
    it('calls GET /admin/v1/analytics/otp', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyOtp);
      await client.getOtp();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/analytics/otp' }),
      );
    });

    it('returns OTP counts without raw OTP values', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ requested: 10, verified: 8, failed: 2 });
      const result = await client.getOtp();
      expect(result.requested).toBe(10);
      expect(result.verified).toBe(8);
      expect(result.failed).toBe(2);
      expect(result).not.toHaveProperty('code');
      expect(result).not.toHaveProperty('otp');
      expect(result).not.toHaveProperty('codeHash');
    });
  });

  describe('getMedia', () => {
    it('calls GET /admin/v1/analytics/media', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptyMedia);
      await client.getMedia();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/analytics/media' }),
      );
    });

    it('returns media summary without storage secrets', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ uploads: 15 });
      const result = await client.getMedia();
      expect(result.uploads).toBe(15);
      expect(result).not.toHaveProperty('objectKey');
      expect(result).not.toHaveProperty('bucket');
      expect(result).not.toHaveProperty('storageProvider');
    });
  });

  describe('SDK safety invariants', () => {
    it('has no real-time analytics method', () => {
      const { client } = createMockClient();
      expect('streamEvents' in client).toBe(false);
      expect('subscribe' in client).toBe(false);
      expect('watchAnalytics' in client).toBe(false);
    });

    it('has no BI/funnel/cohort/revenue method', () => {
      const { client } = createMockClient();
      expect('getFunnel' in client).toBe(false);
      expect('getCohort' in client).toBe(false);
      expect('getRevenue' in client).toBe(false);
      expect('getRetention' in client).toBe(false);
    });

    it('has no Meilisearch-specific method', () => {
      const { client } = createMockClient();
      expect('configureMeilisearch' in client).toBe(false);
    });

    it('getSummary builds correct request without token storage', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue(emptySummary);
      await client.getSummary();
      const callArg = request.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(callArg.method).toBe('GET');
      expect(callArg.path).toMatch(/^\/admin\/v1\/analytics\/summary/);
      expect(callArg).not.toHaveProperty('token');
      expect(callArg).not.toHaveProperty('password');
    });
  });
});
