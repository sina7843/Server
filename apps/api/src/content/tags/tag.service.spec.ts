import { ConflictException } from '@nestjs/common';
import { TagService } from './tag.service';

describe('TagService — slug uniqueness', () => {
  it('rejects creation when slug is already taken', async () => {
    const service = new TagService({
      existsBySlug: jest.fn().mockResolvedValue({ _id: 'existing-id' }),
      create: jest.fn(),
    } as never);

    await expect(
      service.create({
        name: 'TypeScript',
        slug: 'typescript',
        slugNormalized: 'typescript',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('creates tag when slug is not taken', async () => {
    const service = new TagService({
      existsBySlug: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    } as never);

    await expect(
      service.create({
        name: 'TypeScript',
        slug: 'typescript',
        slugNormalized: 'typescript',
      }),
    ).resolves.toBeDefined();
  });

  it('rejects creation when slug fails policy validation', async () => {
    const service = new TagService({
      existsBySlug: jest.fn(),
      create: jest.fn(),
    } as never);

    await expect(
      service.create({
        name: 'TypeScript',
        slug: 'bad/slug',
        slugNormalized: 'bad/slug',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('normalizes slug before uniqueness check', async () => {
    const existsBySlug = jest.fn().mockResolvedValue(null);
    const service = new TagService({
      existsBySlug,
      create: jest.fn().mockResolvedValue({}),
    } as never);

    await service.create({
      name: 'Type Script',
      slug: 'Type Script',
      slugNormalized: 'type-script',
    });

    expect(existsBySlug).toHaveBeenCalledWith('type-script', undefined);
  });
});
