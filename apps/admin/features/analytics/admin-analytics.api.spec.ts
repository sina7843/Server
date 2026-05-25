import { ApiClientError, createAdminAnalyticsClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

const emptySummary = {
  registrations: 0,
  logins: 0,
  otpRequested: 0,
  contentViews: 0,
  contentPublished: 0,
  mediaUploads: 0,
};
const emptyAuth = { registrations: 0, logins: 0 };
const emptyOtp = { requested: 0, verified: 0, failed: 0 };
const emptyContentTop = { views: 0, published: 0, top: [] };
const emptyMedia = { uploads: 0 };

function makeClient() {
  return createAdminAnalyticsClient(
    createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
  );
}

describe('createAdminAnalyticsClient: getSummary', () => {
  it('sends GET /admin/v1/analytics/summary', async () => {
    mockJson(emptySummary);
    await makeClient().getSummary();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/analytics/summary'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('passes dateFrom and dateTo params', async () => {
    mockJson(emptySummary);
    await makeClient().getSummary({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });
    const [[calledUrl]] = mockFetch.mock.calls as [[string]];
    expect(calledUrl).toContain('dateFrom=2026-01-01');
    expect(calledUrl).toContain('dateTo=2026-01-31');
  });

  it('response does not contain raw IP, phone, or token fields', async () => {
    mockJson({ ...emptySummary, registrations: 5 });
    const result = await makeClient().getSummary();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('refreshToken');
    expect(serialized).not.toContain('"phone"');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().getSummary()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminAnalyticsClient: getAuth', () => {
  it('sends GET /admin/v1/analytics/auth', async () => {
    mockJson(emptyAuth);
    await makeClient().getAuth();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/analytics/auth'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('passes date range params', async () => {
    mockJson(emptyAuth);
    await makeClient().getAuth({ dateFrom: '2026-01-01' });
    const [[calledUrl]] = mockFetch.mock.calls as [[string]];
    expect(calledUrl).toContain('dateFrom=2026-01-01');
  });

  it('returns registrations and logins without sensitive data', async () => {
    mockJson({ registrations: 3, logins: 7 });
    const result = await makeClient().getAuth();
    expect(result.registrations).toBe(3);
    expect(result.logins).toBe(7);
    expect(result).not.toHaveProperty('phone');
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('otp');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().getAuth()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminAnalyticsClient: getOtp', () => {
  it('sends GET /admin/v1/analytics/otp', async () => {
    mockJson(emptyOtp);
    await makeClient().getOtp();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/analytics/otp'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns OTP counts without raw OTP values', async () => {
    mockJson({ requested: 10, verified: 8, failed: 2 });
    const result = await makeClient().getOtp();
    expect(result.requested).toBe(10);
    expect(result.verified).toBe(8);
    expect(result.failed).toBe(2);
    expect(result).not.toHaveProperty('otp');
    expect(result).not.toHaveProperty('code');
    expect(result).not.toHaveProperty('codeHash');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().getOtp()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminAnalyticsClient: getContentTop', () => {
  it('sends GET /admin/v1/analytics/content/top', async () => {
    mockJson(emptyContentTop);
    await makeClient().getContentTop();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/analytics/content/top'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('top items do not contain objectKey or storage secrets', async () => {
    mockJson({
      views: 50,
      published: 5,
      top: [{ resourceId: '64f000000000000000000001', views: 20, type: 'news' }],
    });
    const result = await makeClient().getContentTop();
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('objectKey');
    expect(serialized).not.toContain('bucket');
    expect(serialized).not.toContain('storageProvider');
  });

  it('returns zero views and empty top when no data', async () => {
    mockJson(emptyContentTop);
    const result = await makeClient().getContentTop();
    expect(result.views).toBe(0);
    expect(result.top).toHaveLength(0);
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().getContentTop()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminAnalyticsClient: getMedia', () => {
  it('sends GET /admin/v1/analytics/media', async () => {
    mockJson(emptyMedia);
    await makeClient().getMedia();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/v1/analytics/media'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('response does not contain storage secrets', async () => {
    mockJson({ uploads: 15 });
    const result = await makeClient().getMedia();
    expect(result.uploads).toBe(15);
    expect(result).not.toHaveProperty('objectKey');
    expect(result).not.toHaveProperty('bucket');
    expect(result).not.toHaveProperty('storageProvider');
  });

  it('throws ApiClientError on 403', async () => {
    mockJson({ message: 'Forbidden' }, 403);
    await expect(makeClient().getMedia()).rejects.toBeInstanceOf(ApiClientError);
  });
});

describe('createAdminAnalyticsClient: safety invariants', () => {
  it('has no real-time analytics method', () => {
    const client = makeClient();
    expect('streamEvents' in client).toBe(false);
    expect('subscribe' in client).toBe(false);
    expect('watchAnalytics' in client).toBe(false);
  });

  it('has no BI/funnel/cohort/revenue method', () => {
    const client = makeClient();
    expect('getFunnel' in client).toBe(false);
    expect('getCohort' in client).toBe(false);
    expect('getRevenue' in client).toBe(false);
    expect('getRetention' in client).toBe(false);
  });

  it('has no fake data method', () => {
    const client = makeClient();
    expect('createMetric' in client).toBe(false);
    expect('mockData' in client).toBe(false);
    expect('seedAnalytics' in client).toBe(false);
  });

  it('has no marketing analytics method', () => {
    const client = makeClient();
    expect('getConversion' in client).toBe(false);
    expect('getAbTest' in client).toBe(false);
  });
});
