import type { Model } from 'mongoose';
import { PostRepository } from './post.repository';
import type { PostDocument } from './post.schema';

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
  } as unknown as Model<PostDocument>;

  return {
    repository: new PostRepository(model),
    create,
    exec,
    findById,
    findByIdAndUpdate,
    findOne,
  };
}

describe('PostRepository', () => {
  it('finds by id', async () => {
    const { findById, repository } = createRepository();
    await repository.findById('post-id');
    expect(findById).toHaveBeenCalledWith('post-id');
  });

  it('finds by type and slug excluding deleted documents', async () => {
    const { findOne, repository } = createRepository();
    await repository.findByTypeAndSlug('article', 'my-article');
    expect(findOne).toHaveBeenCalledWith({
      type: 'article',
      slugNormalized: 'my-article',
      deletedAt: { $exists: false },
    });
  });

  it('checks slug existence including optional excludeId', async () => {
    const { findOne, repository } = createRepository();
    await repository.existsByTypeAndSlug('news', 'breaking-news', 'other-id');
    expect(findOne).toHaveBeenCalledWith({
      type: 'news',
      slugNormalized: 'breaking-news',
      _id: { $ne: 'other-id' },
    });
  });

  it('checks slug existence without excludeId', async () => {
    const { findOne, repository } = createRepository();
    await repository.existsByTypeAndSlug('news', 'breaking-news');
    expect(findOne).toHaveBeenCalledWith({
      type: 'news',
      slugNormalized: 'breaking-news',
    });
  });

  it('creates a post with required defaults', async () => {
    const { create, repository } = createRepository();
    await repository.create({
      type: 'article',
      title: 'Test Article',
      slug: 'test-article',
      slugNormalized: 'test-article',
      authorId: 'author-id',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'article',
        title: 'Test Article',
        slug: 'test-article',
        slugNormalized: 'test-article',
        slugHistory: [],
        bodyJson: {},
        bodyHtml: '',
        status: 'draft',
        categoryIds: [],
        tagIds: [],
        mediaRefs: [],
        viewCount: 0,
        seo: {},
      }),
    );
  });

  it('creates a post with coverMediaId when provided', async () => {
    const { create, repository } = createRepository();
    await repository.create({
      type: 'article',
      title: 'Test Article',
      slug: 'test-article',
      slugNormalized: 'test-article',
      authorId: 'author-id',
      coverMediaId: '64f000000000000000000001',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ coverMediaId: '64f000000000000000000001' }),
    );
  });

  it('does not set coverMediaId field when not provided', async () => {
    const { create, repository } = createRepository();
    await repository.create({
      type: 'article',
      title: 'Test Article',
      slug: 'test-article',
      slugNormalized: 'test-article',
      authorId: 'author-id',
    });
    const calledWith = create.mock.calls[0][0] as Record<string, unknown>;
    expect(calledWith['coverMediaId']).toBeUndefined();
  });

  it('marks post as published with publishedAt timestamp', async () => {
    const { findByIdAndUpdate, repository } = createRepository();
    const publishedAt = new Date('2026-01-01T00:00:00.000Z');
    await repository.markPublished('post-id', publishedAt);
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'post-id',
      { $set: { status: 'published', publishedAt } },
      { new: true },
    );
  });

  it('marks post as archived', async () => {
    const { findByIdAndUpdate, repository } = createRepository();
    await repository.markArchived('post-id');
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'post-id',
      { $set: { status: 'archived' } },
      { new: true },
    );
  });

  it('soft-deletes post by setting deletedAt — no hard delete', async () => {
    const { findByIdAndUpdate, repository } = createRepository();
    await repository.softDelete('post-id');
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'post-id',
      { $set: { deletedAt: expect.any(Date) } },
      { new: true },
    );
  });

  it('does not expose a hard-delete method', () => {
    const { repository } = createRepository();
    expect('deleteOne' in repository).toBe(false);
    expect('hardDelete' in repository).toBe(false);
    expect('findByIdAndDelete' in repository).toBe(false);
  });

  it('pushes old slug to slugHistory when slug is updated', async () => {
    const { findByIdAndUpdate, repository } = createRepository();
    await repository.updateSlug(
      'post-id',
      { slug: 'new-slug', slugNormalized: 'new-slug' },
      'old-slug',
    );
    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      'post-id',
      {
        $set: { slug: 'new-slug', slugNormalized: 'new-slug' },
        $push: { slugHistory: 'old-slug' },
      },
      { new: true },
    );
  });
});
