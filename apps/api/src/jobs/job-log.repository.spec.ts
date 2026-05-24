import { JobLogRepository } from './job-log.repository';

function createMockModel() {
  const mockDoc = {
    _id: '64f000000000000000000001',
    queueName: 'sms',
    jobName: 'sms.send',
    status: 'queued',
    attempts: 0,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExec = jest.fn().mockResolvedValue(mockDoc);
  const model = {
    create: jest.fn().mockResolvedValue(mockDoc),
    findById: jest.fn().mockReturnValue({ exec: mockExec }),
    findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockDoc]),
    }),
    countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
  };
  return { model, mockDoc };
}

describe('JobLogRepository', () => {
  describe('create', () => {
    it('creates a job log with queued status', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      await repo.create({ queueName: 'sms', jobName: 'sms.send', maxAttempts: 3 });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({
          queueName: 'sms',
          jobName: 'sms.send',
          maxAttempts: 3,
          status: 'queued',
          attempts: 0,
        }),
      );
    });

    it('includes bullJobId if provided', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      await repo.create({
        queueName: 'media',
        jobName: 'media.generate_variants',
        maxAttempts: 3,
        bullJobId: 'bull-123',
      });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ bullJobId: 'bull-123' }));
    });

    it('includes payloadSummary if provided', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);
      const payloadSummary = { assetId: 'abc', size: 1024 };

      await repo.create({
        queueName: 'media',
        jobName: 'media.generate_variants',
        maxAttempts: 3,
        payloadSummary,
      });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ payloadSummary }));
    });

    it('does not include bullJobId when not provided', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      await repo.create({ queueName: 'sms', jobName: 'sms.send', maxAttempts: 3 });

      const callArg = model.create.mock.calls[0]?.[0] as Record<string, unknown>;
      expect('bullJobId' in callArg).toBe(false);
    });
  });

  describe('findById', () => {
    it('finds a job log by id', async () => {
      const { model, mockDoc } = createMockModel();
      const repo = new JobLogRepository(model as never);

      const result = await repo.findById('64f000000000000000000001');

      expect(model.findById).toHaveBeenCalledWith('64f000000000000000000001');
      expect(result).toBe(mockDoc);
    });
  });

  describe('updateStatus', () => {
    it('updates status field', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      await repo.updateStatus('64f000000000000000000001', 'processing');

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('64f000000000000000000001', {
        $set: expect.objectContaining({ status: 'processing' }),
      });
    });

    it('includes attempts when provided', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      await repo.updateStatus('64f000000000000000000001', 'processing', { attempts: 1 });

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('64f000000000000000000001', {
        $set: expect.objectContaining({ attempts: 1 }),
      });
    });

    it('includes error when provided', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      await repo.updateStatus('64f000000000000000000001', 'failed', { error: 'timeout' });

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith('64f000000000000000000001', {
        $set: expect.objectContaining({ error: 'timeout' }),
      });
    });
  });

  describe('list', () => {
    it('queries with no filters returns items and total', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      const result = await repo.list({}, 1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies queueName filter', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      await repo.list({ queueName: 'sms' }, 1, 20);

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ queueName: 'sms' }));
    });

    it('applies status filter', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);

      await repo.list({ status: 'failed' }, 1, 20);

      expect(model.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
    });

    it('applies date range with $gte/$lte', async () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);
      const from = new Date('2025-01-01');
      const to = new Date('2025-12-31');

      await repo.list({ dateFrom: from, dateTo: to }, 1, 20);

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: { $gte: from, $lte: to },
        }),
      );
    });
  });

  describe('append-only safety', () => {
    it('does not expose a delete method', () => {
      const { model } = createMockModel();
      const repo = new JobLogRepository(model as never);
      expect('delete' in repo).toBe(false);
      expect('deleteById' in repo).toBe(false);
      expect('hardDelete' in repo).toBe(false);
    });
  });
});
