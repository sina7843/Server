import { EsportsSeedService } from './esports-seed.service';

describe('EsportsSeedService', () => {
  let service: EsportsSeedService;
  let categoryRepositoryMock: { upsertBySlugForSeed: jest.Mock };
  let tagRepositoryMock: { upsertBySlugForSeed: jest.Mock };

  beforeEach(() => {
    categoryRepositoryMock = {
      upsertBySlugForSeed: jest.fn().mockResolvedValue({ created: true }),
    };
    tagRepositoryMock = {
      upsertBySlugForSeed: jest.fn().mockResolvedValue({ created: true }),
    };
    service = new EsportsSeedService(categoryRepositoryMock as never, tagRepositoryMock as never);
  });

  describe('runEsportsSeed', () => {
    it('calls upsertBySlugForSeed for all three esports categories', async () => {
      await service.runEsportsSeed();

      const slugs = categoryRepositoryMock.upsertBySlugForSeed.mock.calls.map(
        (call) => (call[0] as { slug: string }).slug,
      );
      expect(slugs).toContain('esports');
      expect(slugs).toContain('tournaments');
      expect(slugs).toContain('game-coverage');
      expect(categoryRepositoryMock.upsertBySlugForSeed).toHaveBeenCalledTimes(3);
    });

    it('calls upsertBySlugForSeed for all three esports tags', async () => {
      await service.runEsportsSeed();

      const slugs = tagRepositoryMock.upsertBySlugForSeed.mock.calls.map(
        (call) => (call[0] as { slug: string }).slug,
      );
      expect(slugs).toContain('featured');
      expect(slugs).toContain('breaking-news');
      expect(slugs).toContain('top-content');
      expect(tagRepositoryMock.upsertBySlugForSeed).toHaveBeenCalledTimes(3);
    });

    it('counts created=true responses as categoriesCreated', async () => {
      categoryRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: true });
      tagRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: false });

      const result = await service.runEsportsSeed();

      expect(result.categoriesCreated).toBe(3);
      expect(result.categoriesSkipped).toBe(0);
    });

    it('counts created=false responses as categoriesSkipped', async () => {
      categoryRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: false });
      tagRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: true });

      const result = await service.runEsportsSeed();

      expect(result.categoriesCreated).toBe(0);
      expect(result.categoriesSkipped).toBe(3);
    });

    it('counts created=true responses as tagsCreated', async () => {
      categoryRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: false });
      tagRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: true });

      const result = await service.runEsportsSeed();

      expect(result.tagsCreated).toBe(3);
      expect(result.tagsSkipped).toBe(0);
    });

    it('counts created=false responses as tagsSkipped', async () => {
      categoryRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: false });
      tagRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: false });

      const result = await service.runEsportsSeed();

      expect(result.tagsCreated).toBe(0);
      expect(result.tagsSkipped).toBe(3);
    });

    it('returns a stable EsportsSeedResult shape', async () => {
      const result = await service.runEsportsSeed();

      expect(result).toHaveProperty('categoriesCreated');
      expect(result).toHaveProperty('categoriesSkipped');
      expect(result).toHaveProperty('tagsCreated');
      expect(result).toHaveProperty('tagsSkipped');
      expect(typeof result.categoriesCreated).toBe('number');
      expect(typeof result.categoriesSkipped).toBe('number');
      expect(typeof result.tagsCreated).toBe('number');
      expect(typeof result.tagsSkipped).toBe('number');
    });

    it('does not duplicate creation when upsert returns created=false on repeat run', async () => {
      // Simulate a second run where all items already exist in the database
      categoryRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: false });
      tagRepositoryMock.upsertBySlugForSeed.mockResolvedValue({ created: false });

      const result = await service.runEsportsSeed();

      expect(result.categoriesCreated).toBe(0);
      expect(result.categoriesSkipped).toBe(3);
      expect(result.tagsCreated).toBe(0);
      expect(result.tagsSkipped).toBe(3);
    });

    it('created + skipped counts always total the number of items seeded', async () => {
      categoryRepositoryMock.upsertBySlugForSeed
        .mockResolvedValueOnce({ created: true })
        .mockResolvedValueOnce({ created: false })
        .mockResolvedValueOnce({ created: true });
      tagRepositoryMock.upsertBySlugForSeed
        .mockResolvedValueOnce({ created: false })
        .mockResolvedValueOnce({ created: true })
        .mockResolvedValueOnce({ created: false });

      const result = await service.runEsportsSeed();

      expect(result.categoriesCreated + result.categoriesSkipped).toBe(3);
      expect(result.tagsCreated + result.tagsSkipped).toBe(3);
    });
  });
});
