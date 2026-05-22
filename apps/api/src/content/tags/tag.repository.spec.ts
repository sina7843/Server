import type { Model } from 'mongoose';
import { TagRepository } from './tag.repository';
import type { TagDocument } from './tag.schema';

function createRepository() {
  const exec = jest.fn().mockResolvedValue(null);
  const find = jest.fn().mockReturnValue({ exec });
  const findOne = jest.fn().mockReturnValue({ exec });
  const findById = jest.fn().mockReturnValue({ exec });
  const findByIdAndUpdate = jest.fn().mockReturnValue({ exec });
  const create = jest.fn().mockResolvedValue({});

  const model = {
    create,
    find,
    findOne,
    findById,
    findByIdAndUpdate,
  } as unknown as Model<TagDocument>;

  return {
    repository: new TagRepository(model),
    create,
    exec,
    find,
    findById,
    findByIdAndUpdate,
    findOne,
  };
}

describe('TagRepository', () => {
  it('finds by id', async () => {
    const { findById, repository } = createRepository();
    await repository.findById('tag-id');
    expect(findById).toHaveBeenCalledWith('tag-id');
  });

  it('finds by slug', async () => {
    const { findOne, repository } = createRepository();
    await repository.findBySlug('typescript');
    expect(findOne).toHaveBeenCalledWith({ slugNormalized: 'typescript' });
  });

  it('checks slug existence with excludeId', async () => {
    const { findOne, repository } = createRepository();
    await repository.existsBySlug('typescript', 'other-id');
    expect(findOne).toHaveBeenCalledWith({
      slugNormalized: 'typescript',
      _id: { $ne: 'other-id' },
    });
  });

  it('checks slug existence without excludeId', async () => {
    const { findOne, repository } = createRepository();
    await repository.existsBySlug('typescript');
    expect(findOne).toHaveBeenCalledWith({ slugNormalized: 'typescript' });
  });

  it('lists all tags', async () => {
    const { find, repository } = createRepository();
    await repository.list();
    expect(find).toHaveBeenCalledWith({});
  });

  it('creates tag with required fields', async () => {
    const { create, repository } = createRepository();
    await repository.create({
      name: 'TypeScript',
      slug: 'typescript',
      slugNormalized: 'typescript',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'TypeScript',
        slug: 'typescript',
        slugNormalized: 'typescript',
      }),
    );
  });

  it('does not expose a hard-delete method', () => {
    const { repository } = createRepository();
    expect('deleteOne' in repository).toBe(false);
    expect('hardDelete' in repository).toBe(false);
  });
});
