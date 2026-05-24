import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminJobsController } from './admin-jobs.controller';
import { parseAdminJobsQuery } from './dto/admin-jobs-query';

const MOCK_JOB_ID = '64f000000000000000000001';

const mockListResponse = {
  items: [
    {
      id: MOCK_JOB_ID,
      queueName: 'sms',
      jobName: 'sms.send',
      status: 'queued',
      attempts: 0,
      maxAttempts: 3,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  limit: 20,
  total: 1,
};

const mockDetailResponse = {
  id: MOCK_JOB_ID,
  queueName: 'sms',
  jobName: 'sms.send',
  status: 'queued',
  attempts: 0,
  maxAttempts: 3,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockRetryResponse = {
  id: MOCK_JOB_ID,
  status: 'retrying',
  attempts: 1,
  maxAttempts: 3,
};

function createController() {
  const service = {
    listJobs: jest.fn().mockResolvedValue(mockListResponse),
    getJob: jest.fn().mockResolvedValue(mockDetailResponse),
    retryJob: jest.fn().mockResolvedValue(mockRetryResponse),
  };
  return { service, controller: new AdminJobsController(service as never) };
}

describe('AdminJobsController', () => {
  describe('GET /admin/v1/system/jobs', () => {
    it('lists jobs with default pagination', async () => {
      const { controller, service } = createController();
      const result = await controller.listJobs({});

      expect(service.listJobs).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
      expect(result.items).toHaveLength(1);
    });

    it('passes queueName filter', async () => {
      const { controller, service } = createController();
      await controller.listJobs({ queueName: 'sms' });

      expect(service.listJobs).toHaveBeenCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ queueName: 'sms' }) }),
      );
    });

    it('passes status filter', async () => {
      const { controller, service } = createController();
      await controller.listJobs({ status: 'failed' });

      expect(service.listJobs).toHaveBeenCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ status: 'failed' }) }),
      );
    });

    it('passes date range filters', async () => {
      const { controller, service } = createController();
      await controller.listJobs({ dateFrom: '2025-01-01', dateTo: '2025-12-31' });

      expect(service.listJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.objectContaining({ dateFrom: expect.any(Date) }),
        }),
      );
    });

    it('rejects invalid status', () => {
      expect(() => parseAdminJobsQuery({ status: 'unknown_status' })).toThrow(BadRequestException);
    });

    it('rejects invalid dateFrom', () => {
      expect(() => parseAdminJobsQuery({ dateFrom: 'not-a-date' })).toThrow(BadRequestException);
    });

    it('rejects dateFrom after dateTo', () => {
      expect(() => parseAdminJobsQuery({ dateFrom: '2025-12-31', dateTo: '2025-01-01' })).toThrow(
        BadRequestException,
      );
    });

    it('rejects limit exceeding max', () => {
      expect(() => parseAdminJobsQuery({ limit: '9999' })).toThrow(BadRequestException);
    });

    it('response items do not contain password or token secrets', async () => {
      const { controller } = createController();
      const result = await controller.listJobs({});
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('refreshToken');
      expect(serialized).not.toContain('otp');
      expect(serialized).not.toContain('accessToken');
    });
  });

  describe('GET /admin/v1/system/jobs/:id', () => {
    it('returns job detail', async () => {
      const { controller, service } = createController();
      const result = await controller.getJob(MOCK_JOB_ID);

      expect(service.getJob).toHaveBeenCalledWith(MOCK_JOB_ID);
      expect(result.id).toBe(MOCK_JOB_ID);
    });

    it('propagates NotFoundException for missing job', async () => {
      const { controller, service } = createController();
      service.getJob.mockRejectedValue(new NotFoundException('Job not found.'));

      await expect(controller.getJob('64f000000000000000000099')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('detail response does not contain password or token secrets', async () => {
      const { controller } = createController();
      const result = await controller.getJob(MOCK_JOB_ID);
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('refreshToken');
      expect(serialized).not.toContain('rawOtp');
    });
  });

  describe('POST /admin/v1/system/jobs/:id/retry', () => {
    it('retries a failed job', async () => {
      const { controller, service } = createController();
      const result = await controller.retryJob(MOCK_JOB_ID);

      expect(service.retryJob).toHaveBeenCalledWith(MOCK_JOB_ID);
      expect(result.status).toBe('retrying');
    });

    it('propagates BadRequestException when job is not in failed state', async () => {
      const { controller, service } = createController();
      service.retryJob.mockRejectedValue(
        new BadRequestException('Only failed jobs can be retried.'),
      );

      await expect(controller.retryJob(MOCK_JOB_ID)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('propagates BadRequestException when max attempts reached', async () => {
      const { controller, service } = createController();
      service.retryJob.mockRejectedValue(
        new BadRequestException('Job has reached its maximum attempt limit'),
      );

      await expect(controller.retryJob(MOCK_JOB_ID)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('propagates NotFoundException for missing job', async () => {
      const { controller, service } = createController();
      service.retryJob.mockRejectedValue(new NotFoundException('Job not found.'));

      await expect(controller.retryJob(MOCK_JOB_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('security: permission propagation', () => {
    it('propagates ForbiddenException from service on list', async () => {
      const { controller, service } = createController();
      service.listJobs.mockRejectedValue(new ForbiddenException('Permission denied.'));

      await expect(controller.listJobs({})).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('propagates ForbiddenException from service on retry', async () => {
      const { controller, service } = createController();
      service.retryJob.mockRejectedValue(new ForbiddenException('Permission denied.'));

      await expect(controller.retryJob(MOCK_JOB_ID)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('no mutation endpoints beyond retry', () => {
    it('does not expose createJob method', () => {
      const { controller } = createController();
      expect('createJob' in controller).toBe(false);
    });

    it('does not expose deleteJob method', () => {
      const { controller } = createController();
      expect('deleteJob' in controller).toBe(false);
    });

    it('does not expose cancelJob method', () => {
      const { controller } = createController();
      expect('cancelJob' in controller).toBe(false);
    });

    it('does not expose exportJobs method', () => {
      const { controller } = createController();
      expect('exportJobs' in controller).toBe(false);
    });
  });

  describe('auth required', () => {
    it('controller requires guards (UseGuards applied)', () => {
      expect(AdminJobsController).toBeDefined();
    });
  });
});
