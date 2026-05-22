import { ContentRevisionService } from './content-revision.service';

describe('ContentRevisionService — snapshot creation', () => {
  it('creates a snapshot with revisionNumber 1 for a new resource', async () => {
    const create = jest.fn().mockResolvedValue({ revisionNumber: 1 });
    const service = new ContentRevisionService({
      latestRevisionNumber: jest.fn().mockResolvedValue(0),
      create,
    } as never);

    const result = await service.snapshot('post', 'resource-id', { title: 'Hello' }, 'user-id');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'post',
        resourceId: 'resource-id',
        revisionNumber: 1,
        snapshot: { title: 'Hello' },
        createdBy: 'user-id',
      }),
    );
    expect(result.revisionNumber).toBe(1);
  });

  it('increments revisionNumber per resource', async () => {
    const create = jest.fn().mockResolvedValue({ revisionNumber: 4 });
    const service = new ContentRevisionService({
      latestRevisionNumber: jest.fn().mockResolvedValue(3),
      create,
    } as never);

    await service.snapshot('post', 'resource-id', { title: 'Updated' }, 'user-id');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ revisionNumber: 4 }),
    );
  });

  it('revision numbers are independent per resource', async () => {
    let calls = 0;
    const create = jest.fn().mockImplementation(() => {
      calls++;
      return Promise.resolve({ revisionNumber: calls });
    });
    const latestRevisionNumber = jest.fn().mockResolvedValue(0);
    const service = new ContentRevisionService({ latestRevisionNumber, create } as never);

    await service.snapshot('post', 'resource-a', { title: 'A' }, 'user-id');
    await service.snapshot('post', 'resource-b', { title: 'B' }, 'user-id');

    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ resourceId: 'resource-a', revisionNumber: 1 }),
    );
    expect(create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ resourceId: 'resource-b', revisionNumber: 1 }),
    );
  });
});

describe('ContentRevisionService — no restore', () => {
  it('does not expose a restore method', () => {
    const service = new ContentRevisionService({} as never);
    expect('restore' in service).toBe(false);
  });

  it('does not expose a hardDelete method', () => {
    const service = new ContentRevisionService({} as never);
    expect('hardDelete' in service).toBe(false);
  });
});
