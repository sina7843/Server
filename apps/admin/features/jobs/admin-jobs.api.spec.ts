import { ApiClientError, createAdminJobsClient, createApiClient } from '@dragon/sdk';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => data });
}

beforeEach(() => {
  mockFetch.mockReset();
});

function makeClient() {
  return createAdminJobsClient(
    createApiClient({ baseUrl: '/', headers: { Authorization: 'Bearer token' } }),
  );
}

describe('createAdminJobsClient', () => {
  describe('listJobs', () => {
    it('sends GET /admin/v1/system/jobs', async () => {
      mockJson({ items: [], page: 1, limit: 20, total: 0 });
      await makeClient().listJobs();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/v1/system/jobs'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('passes queueName filter in query string', async () => {
      mockJson({ items: [], page: 1, limit: 20, total: 0 });
      await makeClient().listJobs({ queueName: 'sms' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('queueName=sms'),
        expect.any(Object),
      );
    });

    it('passes status filter in query string', async () => {
      mockJson({ items: [], page: 1, limit: 20, total: 0 });
      await makeClient().listJobs({ status: 'failed' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=failed'),
        expect.any(Object),
      );
    });

    it('passes pagination params', async () => {
      mockJson({ items: [], page: 2, limit: 10, total: 0 });
      await makeClient().listJobs({ page: 2, limit: 10 });
      const url = mockFetch.mock.calls[0]?.[0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
    });

    it('throws ApiClientError on 403', async () => {
      mockJson({ message: 'Forbidden' }, 403);
      await expect(makeClient().listJobs()).rejects.toBeInstanceOf(ApiClientError);
    });

    it('response does not expose raw payload secrets', async () => {
      mockJson({
        items: [
          {
            id: '1',
            queueName: 'sms',
            jobName: 'sms.send',
            status: 'completed',
            attempts: 1,
            maxAttempts: 3,
            createdAt: new Date().toISOString(),
          },
        ],
        page: 1,
        limit: 20,
        total: 1,
      });
      const result = await makeClient().listJobs();
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('otp');
      expect(serialized).not.toContain('token');
      expect(serialized).not.toContain('secret');
    });

    it('has no realtime, cancel, or analytics methods', () => {
      const client = makeClient();
      expect('subscribe' in client).toBe(false);
      expect('cancelJob' in client).toBe(false);
      expect('triggerAnalyticsJob' in client).toBe(false);
      expect('connectLive' in client).toBe(false);
    });
  });

  describe('getJob', () => {
    it('sends GET /admin/v1/system/jobs/:id', async () => {
      mockJson({
        id: 'job-1',
        queueName: 'sms',
        jobName: 'sms.send',
        status: 'completed',
        attempts: 1,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await makeClient().getJob('job-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/v1/system/jobs/job-1'),
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('payloadSummary in response does not contain raw OTP or tokens', async () => {
      mockJson({
        id: 'job-1',
        queueName: 'sms',
        jobName: 'sms.send',
        status: 'completed',
        attempts: 1,
        maxAttempts: 3,
        payloadSummary: { smsBody: '[REDACTED]', recipientPhoneNormalized: '[REDACTED]' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const result = await makeClient().getJob('job-1');
      const serialized = JSON.stringify(result.payloadSummary);
      expect(serialized).not.toMatch(/\d{6}/);
      expect(serialized).not.toContain('otp');
    });

    it('throws ApiClientError on 404', async () => {
      mockJson({ message: 'Not Found' }, 404);
      await expect(makeClient().getJob('nonexistent')).rejects.toBeInstanceOf(ApiClientError);
    });
  });

  describe('retryJob', () => {
    it('sends POST /admin/v1/system/jobs/:id/retry', async () => {
      mockJson({ id: 'job-1', status: 'retrying', attempts: 2, maxAttempts: 3 });
      await makeClient().retryJob('job-1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/v1/system/jobs/job-1/retry'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('throws ApiClientError on 403 (missing system.job.retry)', async () => {
      mockJson({ message: 'Forbidden' }, 403);
      await expect(makeClient().retryJob('job-1')).rejects.toBeInstanceOf(ApiClientError);
    });

    it('throws ApiClientError on 409 (max attempts exceeded)', async () => {
      mockJson({ message: 'Max attempts exceeded' }, 409);
      await expect(makeClient().retryJob('job-1')).rejects.toBeInstanceOf(ApiClientError);
    });
  });
});
