import { JobLogService } from './job-log.service';

const MOCK_JOB_LOG_ID = '64f000000000000000000001';

function createMocks() {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    list: jest.fn(),
  };

  const redactor = {
    redact: jest.fn().mockImplementation((p: unknown) => p as Record<string, unknown>),
  };

  const mockBullJob = { id: 'bull-job-1' };

  const smsQueue = { add: jest.fn().mockResolvedValue(mockBullJob), getJob: jest.fn() };
  const mediaQueue = { add: jest.fn().mockResolvedValue(mockBullJob), getJob: jest.fn() };
  const maintenanceQueue = { add: jest.fn().mockResolvedValue(mockBullJob), getJob: jest.fn() };
  const searchQueue = { add: jest.fn().mockResolvedValue(mockBullJob), getJob: jest.fn() };

  const mockJobLog = {
    _id: MOCK_JOB_LOG_ID,
    queueName: 'sms',
    jobName: 'sms.send',
    status: 'queued',
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  repository.create.mockResolvedValue(mockJobLog);
  repository.findById.mockResolvedValue(mockJobLog);

  const service = new JobLogService(
    repository as never,
    redactor as never,
    smsQueue as never,
    mediaQueue as never,
    maintenanceQueue as never,
    searchQueue as never,
  );

  return {
    service,
    repository,
    redactor,
    smsQueue,
    mediaQueue,
    maintenanceQueue,
    searchQueue,
    mockJobLog,
  };
}

describe('JobLogService', () => {
  describe('enqueue', () => {
    it('creates a JobLog with status queued', async () => {
      const { service, repository } = createMocks();

      await service.enqueue({ queueName: 'sms', jobName: 'sms.send', payload: { phone: '+1234' } });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: 'sms',
          jobName: 'sms.send',
          maxAttempts: 3,
        }),
      );
    });

    it('redacts the payload before storing in JobLog', async () => {
      const { service, redactor } = createMocks();

      await service.enqueue({ queueName: 'sms', jobName: 'sms.send', payload: { phone: '+1234' } });

      expect(redactor.redact).toHaveBeenCalledWith({ phone: '+1234' });
    });

    it('adds job to the correct BullMQ queue', async () => {
      const { service, smsQueue } = createMocks();

      await service.enqueue({ queueName: 'sms', jobName: 'sms.send', payload: { phone: '+1234' } });

      expect(smsQueue.add).toHaveBeenCalledWith(
        'sms.send',
        expect.objectContaining({ jobLogId: MOCK_JOB_LOG_ID }),
        expect.objectContaining({ attempts: 3 }),
      );
    });

    it('uses exponential backoff', async () => {
      const { service, smsQueue } = createMocks();

      await service.enqueue({ queueName: 'sms', jobName: 'sms.send', payload: {} });

      expect(smsQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ backoff: { type: 'exponential', delay: 2000 } }),
      );
    });

    it('uses the media queue for media jobs', async () => {
      const { service, mediaQueue } = createMocks();

      await service.enqueue({
        queueName: 'media',
        jobName: 'media.generate_variants',
        payload: { assetId: 'abc' },
      });

      expect(mediaQueue.add).toHaveBeenCalled();
    });

    it('uses the maintenance queue for maintenance jobs', async () => {
      const { service, maintenanceQueue } = createMocks();

      await service.enqueue({
        queueName: 'maintenance',
        jobName: 'maintenance.cleanup_expired_sessions',
        payload: {},
      });

      expect(maintenanceQueue.add).toHaveBeenCalled();
    });

    it('updates JobLog with bullJobId after enqueuing', async () => {
      const { service, repository } = createMocks();

      await service.enqueue({ queueName: 'sms', jobName: 'sms.send', payload: {} });

      expect(repository.updateStatus).toHaveBeenCalledWith(
        MOCK_JOB_LOG_ID,
        'queued',
        expect.objectContaining({ bullJobId: 'bull-job-1' }),
      );
    });

    it('marks JobLog as failed and re-throws when BullMQ add fails', async () => {
      const { service, repository, smsQueue } = createMocks();
      smsQueue.add.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        service.enqueue({ queueName: 'sms', jobName: 'sms.send', payload: {} }),
      ).rejects.toThrow('Redis connection failed');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        MOCK_JOB_LOG_ID,
        'failed',
        expect.objectContaining({ error: 'Redis connection failed' }),
      );
    });

    it('does not store raw password in payloadSummary', async () => {
      const { service, repository, redactor } = createMocks();
      redactor.redact.mockReturnValue({ phone: '+1234' });

      await service.enqueue({
        queueName: 'sms',
        jobName: 'sms.send',
        payload: { phone: '+1234', password: 'secret' },
      });

      const createArg = repository.create.mock.calls[0]?.[0] as Record<string, unknown>;
      const summary = JSON.stringify(createArg.payloadSummary ?? {});
      expect(summary).not.toContain('secret');
    });
  });

  describe('findById', () => {
    it('delegates to repository.findById', async () => {
      const { service, repository, mockJobLog } = createMocks();

      const result = await service.findById(MOCK_JOB_LOG_ID);

      expect(repository.findById).toHaveBeenCalledWith(MOCK_JOB_LOG_ID);
      expect(result).toBe(mockJobLog);
    });
  });

  describe('updateStatus', () => {
    it('delegates to repository.updateStatus', async () => {
      const { service, repository } = createMocks();

      await service.updateStatus(MOCK_JOB_LOG_ID, 'processing', { attempts: 1 });

      expect(repository.updateStatus).toHaveBeenCalledWith(MOCK_JOB_LOG_ID, 'processing', {
        attempts: 1,
      });
    });
  });

  describe('list', () => {
    it('delegates to repository.list', async () => {
      const { service, repository } = createMocks();
      repository.list.mockResolvedValue({ items: [], total: 0 });

      await service.list({ status: 'failed' }, 1, 20);

      expect(repository.list).toHaveBeenCalledWith({ status: 'failed' }, 1, 20);
    });
  });
});
