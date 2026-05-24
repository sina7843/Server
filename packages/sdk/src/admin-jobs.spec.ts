import { createAdminJobsClient } from './admin-jobs';

function createMockClient() {
  const request = jest.fn();
  const client = createAdminJobsClient({ request } as never);
  return { request, client };
}

describe('createAdminJobsClient', () => {
  describe('listJobs', () => {
    it('calls GET /admin/v1/system/jobs with no params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listJobs();
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET', path: '/admin/v1/system/jobs' }),
      );
    });

    it('passes queueName filter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listJobs({ queueName: 'sms' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/admin/v1/system/jobs?queueName=sms' }),
      );
    });

    it('passes status filter', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listJobs({ status: 'failed' });
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/admin/v1/system/jobs?status=failed' }),
      );
    });

    it('passes pagination params', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 2, limit: 10, total: 0 });
      await client.listJobs({ page: 2, limit: 10 });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('page=2');
      expect(callArg.path).toContain('limit=10');
    });

    it('passes date range filters', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ items: [], page: 1, limit: 20, total: 0 });
      await client.listJobs({ dateFrom: '2025-01-01', dateTo: '2025-12-31' });
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toContain('dateFrom=2025-01-01');
      expect(callArg.path).toContain('dateTo=2025-12-31');
    });

    it('does not expose realtime or websocket methods', () => {
      const { client } = createMockClient();
      expect('subscribe' in client).toBe(false);
      expect('onJobUpdate' in client).toBe(false);
      expect('connectLive' in client).toBe(false);
    });

    it('does not expose search or analytics job methods', () => {
      const { client } = createMockClient();
      expect('triggerSearchIndexJob' in client).toBe(false);
      expect('triggerAnalyticsJob' in client).toBe(false);
      expect('runBackup' in client).toBe(false);
    });

    it('does not expose cancel or delete methods', () => {
      const { client } = createMockClient();
      expect('cancelJob' in client).toBe(false);
      expect('deleteJob' in client).toBe(false);
    });
  });

  describe('getJob', () => {
    it('calls GET /admin/v1/system/jobs/:id', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ id: '64f000000000000000000001' });
      await client.getJob('64f000000000000000000001');
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          path: '/admin/v1/system/jobs/64f000000000000000000001',
        }),
      );
    });

    it('URL-encodes the id', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({ id: 'abc' });
      await client.getJob('abc/def');
      const callArg = request.mock.calls[0]?.[0] as { path: string };
      expect(callArg.path).toBe('/admin/v1/system/jobs/abc%2Fdef');
    });
  });

  describe('retryJob', () => {
    it('calls POST /admin/v1/system/jobs/:id/retry', async () => {
      const { request, client } = createMockClient();
      request.mockResolvedValue({
        id: '64f000000000000000000001',
        status: 'retrying',
        attempts: 2,
        maxAttempts: 3,
      });
      await client.retryJob('64f000000000000000000001');
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/admin/v1/system/jobs/64f000000000000000000001/retry',
        }),
      );
    });
  });
});
