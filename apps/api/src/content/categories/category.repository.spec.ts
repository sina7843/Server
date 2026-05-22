import type { Model } from 'mongoose';
import { CategoryRepository } from './category.repository';
import type { CategoryDocument } from './category.schema';

function createRepository() {
  const exec = jest.fn().mockResolvedValue(null);
  const sort = jest.fn().mockReturnValue({ exec });
  const find = jest.fn().mockReturnValue({ sort });
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
  } as unknown as Model<CategoryDocument>;

  return {
    repository: new CategoryRepository(model),
    create,
    exec,
    find,
    findById,
    findByIdAndUpdate,
    findOne,
    sort,
  };
}

describe('CategoryRepository', () => {
  it('finds by id', async () => {
    const { findById, repository } = createRepository();
    await repository.findById('cat-id');
    expect(findById).toHaveBeenCalledWith('cat-id');
  });

  it('finds by slug', async () => {
    const { findOne, repository } = createRepository();
    await repository.findBySlug('technology');
    expect(findOne).toHaveBeenCalledWith({ slugNormalized: 'technology' });
  });

  it('checks slug existence with excludeId', async () => {
    const { findOne, repository } = createRepository();
    await repository.existsBySlug('technology', 'other-id');
    expect(findOne).toHaveBeenCalledWith({
      slugNormalized: 'technology',
      _id: { $ne: 'other-id' },
    });
  });

  it('checks slug existence without excludeId', async () => {
    const { findOne, repository } = createRepository();
    await repository.existsBySlug('technology');
    expect(findOne).toHaveBeenCalledWith({ slugNormalized: 'technology' });
  });

  it('lists categories sorted by sortOrder ascending', async () => {
    const { find, sort, repository } = createRepository();
    await repository.list();
    expect(find).toHaveBeenCalledWith({});
    expect(sort).toHaveBeenCalledWith({ sortOrder: 1 });
  });

  it('creates category with required fields', async () => {
    const { create, repository } = createRepository();
    await repository.create({
      name: 'Technology',
      slug: 'technology',
      slugNormalized: 'technology',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Technology',
        slug: 'technology',
        slugNormalized: 'technology',
        sortOrder: 0,
      }),
    );
  });

  it('creates category with optional fields when provided', async () => {
    const { create, repository } = createRepository();
    await repository.create({
      name: 'Technology',
      slug: 'technology',
      slugNormalized: 'technology',
      description: 'Tech news',
      parentId: 'parent-id' as never,
      sortOrder: 5,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Tech news',
        parentId: 'parent-id',
        sortOrder: 5,
      }),
    );
  });
});
