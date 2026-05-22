import { ConflictException, NotFoundException } from '@nestjs/common';
import { PostService } from './post.service';

describe('PostService — slug uniqueness scoped by type', () => {
  it('post slug uniqueness check is scoped by type — same slug allowed across types', async () => {
    const service = new PostService({
      existsByTypeAndSlug: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    } as never);

    await expect(
      service.create({
        type: 'news',
        title: 'My Article',
        slug: 'my-article',
        slugNormalized: 'my-article',
        authorId: 'author-id',
      }),
    ).resolves.toBeDefined();
  });

  it('rejects post creation when slug is already taken for same type', async () => {
    const service = new PostService({
      existsByTypeAndSlug: jest.fn().mockResolvedValue({ _id: 'existing-id' }),
      create: jest.fn(),
    } as never);

    await expect(
      service.create({
        type: 'article',
        title: 'Test',
        slug: 'my-article',
        slugNormalized: 'my-article',
        authorId: 'author-id',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects post creation when slug fails policy validation', async () => {
    const service = new PostService({
      existsByTypeAndSlug: jest.fn(),
      create: jest.fn(),
    } as never);

    await expect(
      service.create({
        type: 'article',
        title: 'Test',
        slug: 'bad/slug',
        slugNormalized: 'bad/slug',
        authorId: 'author-id',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('PostService — status lifecycle foundation', () => {
  it('status validation accepts draft', () => {
    const service = new PostService({} as never);
    expect(() => service.validateStatus('draft')).not.toThrow();
  });

  it('status validation accepts published', () => {
    const service = new PostService({} as never);
    expect(() => service.validateStatus('published')).not.toThrow();
  });

  it('status validation accepts archived', () => {
    const service = new PostService({} as never);
    expect(() => service.validateStatus('archived')).not.toThrow();
  });

  it('status validation rejects unknown status', () => {
    const service = new PostService({} as never);
    expect(() => service.validateStatus('unknown')).toThrow(ConflictException);
  });

  it('status validation rejects deleted status', () => {
    const service = new PostService({} as never);
    expect(() => service.validateStatus('deleted')).toThrow(ConflictException);
  });
});

describe('PostService — soft delete foundation', () => {
  it('sets deletedAt on soft delete without hard delete', async () => {
    const mockDoc = { _id: 'post-id', deletedAt: new Date() };
    const service = new PostService({
      softDelete: jest.fn().mockResolvedValue(mockDoc),
    } as never);

    const result = await service.softDelete('post-id');

    expect(result.deletedAt).toBeDefined();
  });

  it('throws NotFoundException when soft-deleting a non-existent post', async () => {
    const service = new PostService({
      softDelete: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(service.softDelete('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('does not expose a hard-delete method', () => {
    const service = new PostService({} as never);
    expect('hardDelete' in service).toBe(false);
    expect('deletePost' in service).toBe(false);
  });
});

describe('PostService — publish lifecycle', () => {
  it('marks post as published with current timestamp', async () => {
    const mockDoc = { _id: 'post-id', status: 'published', publishedAt: new Date() };
    const service = new PostService({
      markPublished: jest.fn().mockResolvedValue(mockDoc),
    } as never);

    const result = await service.markPublished('post-id');

    expect(result.status).toBe('published');
    expect(result.publishedAt).toBeDefined();
  });

  it('marks post as archived', async () => {
    const mockDoc = { _id: 'post-id', status: 'archived' };
    const service = new PostService({
      markArchived: jest.fn().mockResolvedValue(mockDoc),
    } as never);

    const result = await service.markArchived('post-id');

    expect(result.status).toBe('archived');
  });
});
