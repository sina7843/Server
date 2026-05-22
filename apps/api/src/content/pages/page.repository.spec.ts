import type { Model } from 'mongoose';
import { PageRepository } from './page.repository';
import type { PageDocument } from './page.schema';

function createRepository() {
  const exec = jest.fn().mockResolvedValue(null);
  const findOne = jest.fn().mockReturnValue({ exec });
  const findById = jest.fn().mockReturnValue({ exec });
  const findByIdAndUpdate = jest.fn().mockReturnValue({ exec });
  const create = jest.fn().mockResolvedValue({});

  const model = {
    create,
    findOne,
    findById,
    findByIdAndUpdate,
  } as unknown as Model<PageDocument>;

  return {
    repository: new PageRepository(model),
    create,
    exec,
    findById,
    findByIdAndUpdate,
    findOne,
  };
}

describe('PageRepository', () => {
  it('finds by id', async () => {
    const { findById, repository } = createRepository();
    await repository.findById('page-id');
    expect(findById).toHaveBeenCalledWith('page-id');
  });

  it('finds by slug excluding deleted documents', async () => {
    const { findOne, repository } = createRepository();
    await repository.findBySlug('about-us');
    expect(findOne).toHaveBeenCalledWith({
      slugNormalized: 'about-us',
      deletedAt: { $exists: false },
    });
  });

  it('checks slug existence including optional excludeId', async () => {
    const { findOne, repository } = createRepository();
    await repository.existsBySlug('about-us', 'other-id');
    expect(findOne).toHaveBeenCalledWith({
      slugNormalized: 'about-us',
      _id: { $ne: 'other-id' },
    });
  });

  it('checks slug existence without excludeId', async () => {
    const { findOne, repository } = createRepository();
    await repository.existsBySlug('about-us');
    expect(findOne).toHaveBeenCalledWith({ slugNormalized: 'about-us' });
  });

  it('creates a page with required defaults', async () => {
    const { create, repository } = createRepository();
    await repository.create({
      title: 'About',
      slug: 'about-us',
      slugNormalized: 'about-us',
      createdBy: 'user-id',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'About',
        slug: 'about-us',
        slugNormalized: 'about-us',
        slugHistory: [],
        bodyJson: {},
        bodyHtml: '',
        status: 'draft',
        seo: {},
      }),
    );
  });

  it('soft-deletes page by setting deletedAt — no hard delete', async () => {
    const { findByIdAndUpdate, repository } = createRepository();
    await repository.softDelete('page-id');
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'page-id',
      { $set: { deletedAt: expect.any(Date) } },
      { new: true },
    );
  });

  it('does not expose a hard-delete method', () => {
    const { repository } = createRepository();
    expect('deleteOne' in repository).toBe(false);
    expect('hardDelete' in repository).toBe(false);
  });
});
