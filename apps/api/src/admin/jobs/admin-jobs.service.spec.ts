import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminJobsService } from './admin-jobs.service';

const VALID_ID = '64f000000000000000000001';

function makeDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: VALID_ID,
    id: VALID_ID,
    queueName: 'sms',
    jobName: 'sms.send',
    bullJobId: 'bull-job-42',
    status: 'failed',
    attempts: 1,
    maxAttempts: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as never;
}

function makeRepository(doc: unknown = makeDoc(), docAfterUpdate?: unknown) {
  const findById = docAfterUpdate
    ? jest.fn().mockResolvedValueOnce(doc).mockResolvedValueOnce(docAfterUpdate)
    : jest.fn().mockResolvedValue(doc);
  return {
    findById,
    updateStatus: jest.fn().mockResolvedValue(undefined),
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
  };
}

function makeBullJob(retryImpl: () => Promise<void> = () => Promise.resolve()) {
  return { retry: jest.fn().mockImplementation(retryImpl) };
}

function makeQueue(bullJob: unknown = makeBullJob()) {
  return { getJob: jest.fn().mockResolvedValue(bullJob) };
}

function makeService(
  repository: ReturnType<typeof makeRepository>,
  smsQueue: ReturnType<typeof makeQueue>,
) {
  return new AdminJobsService(
    repository as never,
    smsQueue as never,
    makeQueue() as never,
    makeQueue() as never,
    makeQueue() as never,
  );
}

describe('AdminJobsService.retryJob', () => {
  it('successfully retries a failed job', async () => {
    const retryingDoc = makeDoc({ status: 'retrying' });
    const repository = makeRepository(makeDoc(), retryingDoc);
    const bullJob = makeBullJob();
    const smsQueue = makeQueue(bullJob);
    const service = makeService(repository, smsQueue);

    const result = await service.retryJob(VALID_ID);

    expect(bullJob.retry).toHaveBeenCalledTimes(1);
    expect(repository.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      'retrying',
      expect.any(Object),
    );
    expect(result.status).toBe('retrying');
  });

  it('sets JobLog to retrying only after BullMQ retry succeeds', async () => {
    const repository = makeRepository();
    const bullJob = makeBullJob();
    const smsQueue = makeQueue(bullJob);
    const service = makeService(repository, smsQueue);

    await service.retryJob(VALID_ID);

    const calls: [string, string][] = repository.updateStatus.mock.calls;
    const retryingCall = calls.find((c) => c[1] === 'retrying');
    expect(retryingCall).toBeDefined();
  });

  it('throws BadRequestException when bullJobId is missing', async () => {
    const repository = makeRepository(makeDoc({ bullJobId: undefined }));
    const smsQueue = makeQueue();
    const service = makeService(repository, smsQueue);

    await expect(service.retryJob(VALID_ID)).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.updateStatus).not.toHaveBeenCalledWith(
      expect.any(String),
      'retrying',
      expect.any(Object),
    );
  });

  it('throws BadRequestException when BullMQ job not found in queue', async () => {
    const repository = makeRepository();
    const smsQueue = makeQueue(null);
    const service = makeService(repository, smsQueue);

    await expect(service.retryJob(VALID_ID)).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.updateStatus).not.toHaveBeenCalledWith(
      expect.any(String),
      'retrying',
      expect.any(Object),
    );
  });

  it('reverts JobLog to failed and throws BadRequestException when bullJob.retry() throws', async () => {
    const repository = makeRepository();
    const bullJob = makeBullJob(() => Promise.reject(new Error('BullMQ internal error')));
    const smsQueue = makeQueue(bullJob);
    const service = makeService(repository, smsQueue);

    await expect(service.retryJob(VALID_ID)).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.updateStatus).toHaveBeenCalledWith(
      expect.any(String),
      'failed',
      expect.objectContaining({ error: expect.any(String) }),
    );
    expect(repository.updateStatus).not.toHaveBeenCalledWith(
      expect.any(String),
      'retrying',
      expect.any(Object),
    );
  });

  it('does not leave job in retrying state when BullMQ retry fails', async () => {
    const repository = makeRepository();
    const bullJob = makeBullJob(() => Promise.reject(new Error('timeout')));
    const smsQueue = makeQueue(bullJob);
    const service = makeService(repository, smsQueue);

    try {
      await service.retryJob(VALID_ID);
    } catch {
      // expected
    }

    const calls: [string, string][] = repository.updateStatus.mock.calls;
    const retryingCall = calls.find((c) => c[1] === 'retrying');
    expect(retryingCall).toBeUndefined();
  });

  it('throws NotFoundException when job does not exist', async () => {
    const repository = makeRepository(null);
    const smsQueue = makeQueue();
    const service = makeService(repository, smsQueue);

    await expect(service.retryJob(VALID_ID)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when job is not in failed status', async () => {
    const repository = makeRepository(makeDoc({ status: 'completed' }));
    const smsQueue = makeQueue();
    const service = makeService(repository, smsQueue);

    await expect(service.retryJob(VALID_ID)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException when attempts >= maxAttempts', async () => {
    const repository = makeRepository(makeDoc({ attempts: 3, maxAttempts: 3 }));
    const smsQueue = makeQueue();
    const service = makeService(repository, smsQueue);

    await expect(service.retryJob(VALID_ID)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('error message from BullMQ retry failure does not leak raw credentials', async () => {
    const repository = makeRepository();
    const bullJob = makeBullJob(() => Promise.reject(new Error('redis://user:secret@host:6379')));
    const smsQueue = makeQueue(bullJob);
    const service = makeService(repository, smsQueue);

    let thrownError: BadRequestException | undefined;
    try {
      await service.retryJob(VALID_ID);
    } catch (err) {
      thrownError = err as BadRequestException;
    }

    expect(thrownError).toBeInstanceOf(BadRequestException);
    const msg = thrownError!.message;
    expect(msg).not.toContain('secret');
    expect(msg).not.toContain('redis://');
    expect(msg).not.toContain('password');
  });
});
