import { ConflictException } from '@nestjs/common';
import { CategoryService } from './category.service';

describe('CategoryService — slug uniqueness', () => {
  it('rejects creation when slug is already taken', async () => {
    const service = new CategoryService({
      existsBySlug: jest.fn().mockResolvedValue({ _id: 'existing-id' }),
      create: jest.fn(),
    } as never);

    await expect(
      service.create({
        name: 'Technology',
        slug: 'technology',
        slugNormalized: 'technology',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates category when slug is not taken', async () => {
    const service = new CategoryService({
      existsBySlug: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    } as never);

    await expect(
      service.create({
        name: 'Technology',
        slug: 'technology',
        slugNormalized: 'technology',
      }),
    ).resolves.toBeDefined();
  });

  it('rejects creation when slug fails policy validation', async () => {
    const service = new CategoryService({
      existsBySlug: jest.fn(),
      create: jest.fn(),
    } as never);

    await expect(
      service.create({
        name: 'Technology',
        slug: 'bad/slug',
        slugNormalized: 'bad/slug',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('normalizes slug before uniqueness check', async () => {
    const existsBySlug = jest.fn().mockResolvedValue(null);
    const service = new CategoryService({
      existsBySlug,
      create: jest.fn().mockResolvedValue({}),
    } as never);

    await service.create({
      name: 'Tech News',
      slug: 'Tech News',
      slugNormalized: 'tech-news',
    });

    expect(existsBySlug).toHaveBeenCalledWith('tech-news', undefined);
  });
});
