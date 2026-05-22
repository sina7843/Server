import type { Model } from 'mongoose';
import { ContentRevisionRepository } from './content-revision.repository';
import type { ContentRevisionDocument } from './content-revision.schema';

function createRepository() {
  const exec = jest.fn().mockResolvedValue(null);
  const sort = jest.fn().mockReturnValue({ exec });
  const findOne = jest.fn().mockReturnValue({ sort });
  const find = jest.fn().mockReturnValue({ sort });
  const findById = jest.fn().mockReturnValue({ exec });
  const create = jest.fn().mockResolvedValue({});

  const model = {
    create,
    find,
    findById,
    findOne,
  } as unknown as Model<ContentRevisionDocument>;

  return {
    repository: new ContentRevisionRepository(model),
    create,
    exec,
    find,
    findById,
    findOne,
    sort,
  };
}

describe('ContentRevisionRepository', () => {
  it('finds by id', async () => {
    const { findById, repository } = createRepository();
    await repository.findById('rev-id');
    expect(findById).toHaveBeenCalledWith('rev-id');
  });

  it('lists revisions for a resource sorted by revisionNumber descending', async () => {
    const { find, sort, repository } = createRepository();
    await repository.listByResource('post', 'resource-id');
    expect(find).toHaveBeenCalledWith({ resourceType: 'post', resourceId: 'resource-id' });
    expect(sort).toHaveBeenCalledWith({ revisionNumber: -1 });
  });

  it('returns 0 when no revisions exist for resource', async () => {
    const { repository } = createRepository();
    const result = await repository.latestRevisionNumber('post', 'resource-id');
    expect(result).toBe(0);
  });

  it('returns latest revision number when revisions exist', async () => {
    const exec = jest.fn().mockResolvedValue({ revisionNumber: 3 });
    const sort = jest.fn().mockReturnValue({ exec });
    const findOne = jest.fn().mockReturnValue({ sort });
    const find = jest.fn().mockReturnValue({ sort });
    const model = { find, findOne } as unknown as Model<ContentRevisionDocument>;
    const repository = new ContentRevisionRepository(model);

    const result = await repository.latestRevisionNumber('post', 'resource-id');
    expect(result).toBe(3);
  });

  it('creates a revision with all required fields', async () => {
    const { create, repository } = createRepository();
    await repository.create({
      resourceType: 'post',
      resourceId: 'resource-id',
      revisionNumber: 1,
      snapshot: { title: 'Hello' },
      createdBy: 'user-id',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: 'post',
        resourceId: 'resource-id',
        revisionNumber: 1,
        snapshot: { title: 'Hello' },
        createdBy: 'user-id',
      }),
    );
  });

  it('does not expose a hard-delete method', () => {
    const { repository } = createRepository();
    expect('deleteOne' in repository).toBe(false);
    expect('hardDelete' in repository).toBe(false);
  });

  it('does not expose a restore method', () => {
    const { repository } = createRepository();
    expect('restore' in repository).toBe(false);
  });
});
