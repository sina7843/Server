import { ConflictException, NotFoundException } from '@nestjs/common';
import { PageService } from './page.service';

describe('PageService — slug uniqueness is global', () => {
  it('page slug uniqueness check is global — rejects any duplicate', async () => {
    const service = new PageService({
      existsBySlug: jest.fn().mockResolvedValue({ _id: 'existing-id' }),
      create: jest.fn(),
    } as never);

    await expect(
      service.create({
        title: 'About',
        slug: 'about-us',
        slugNormalized: 'about-us',
        createdBy: 'user-id',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates page when slug is not taken', async () => {
    const service = new PageService({
      existsBySlug: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    } as never);

    await expect(
      service.create({
        title: 'About',
        slug: 'about-us',
        slugNormalized: 'about-us',
        createdBy: 'user-id',
      }),
    ).resolves.toBeDefined();
  });

  it('rejects page creation when slug fails policy validation', async () => {
    const service = new PageService({
      existsBySlug: jest.fn(),
      create: jest.fn(),
    } as never);

    await expect(
      service.create({
        title: 'About',
        slug: 'bad/slug',
        slugNormalized: 'bad/slug',
        createdBy: 'user-id',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('PageService — soft delete foundation', () => {
  it('sets deletedAt on soft delete', async () => {
    const mockDoc = { _id: 'page-id', deletedAt: new Date() };
    const service = new PageService({
      softDelete: jest.fn().mockResolvedValue(mockDoc),
    } as never);

    const result = await service.softDelete('page-id');
    expect(result.deletedAt).toBeDefined();
  });

  it('throws NotFoundException when soft-deleting a non-existent page', async () => {
    const service = new PageService({
      softDelete: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(service.softDelete('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('does not expose a hard-delete method', () => {
    const service = new PageService({} as never);
    expect('hardDelete' in service).toBe(false);
  });
});
