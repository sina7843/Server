import { NotFoundException } from '@nestjs/common';
import { PublicPagesController } from './public-pages.controller';

const PAGE_ID = '507f1f77bcf86cd799439011';

function makePage(overrides: Record<string, unknown> = {}) {
  return {
    _id: PAGE_ID,
    title: 'About Us',
    slug: 'about-us',
    slugNormalized: 'about-us',
    bodyHtml: '<p>content</p>',
    bodyJson: { type: 'doc', content: [] },
    status: 'published',
    publishedAt: new Date('2026-01-15'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    seo: {},
    ...overrides,
  };
}

function makeController(page: unknown = makePage()) {
  const pageService = {
    findPublishedBySlug: jest.fn().mockResolvedValue(page),
  };
  const track = jest.fn();
  const analyticsService = { track };
  const controller = new PublicPagesController(pageService as never, analyticsService as never);
  return { controller, pageService, track };
}

describe('PublicPagesController', () => {
  describe('GET /api/v1/pages/:slug', () => {
    it('returns published page response', async () => {
      const { controller } = makeController();
      const result = await controller.getPage('about-us');
      expect(result).toBeDefined();
    });

    it('throws NotFoundException when page does not exist', async () => {
      const { controller } = makeController(null);
      await expect(controller.getPage('nonexistent')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for invalid slug', async () => {
      const { controller } = makeController();
      await expect(controller.getPage('../escape')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('tracks content.viewed for existing published page', async () => {
      const { controller, track } = makeController();
      await controller.getPage('about-us');
      expect(track).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'content.viewed',
          resourceType: 'page',
          resourceId: PAGE_ID,
        }),
      );
    });

    it('does not track content.viewed when page is not found', async () => {
      const { controller, track } = makeController(null);
      await expect(controller.getPage('about-us')).rejects.toThrow();
      expect(track).not.toHaveBeenCalled();
    });

    it('analytics payload does not include bodyHtml or bodyJson', async () => {
      const { controller, track } = makeController();
      await controller.getPage('about-us');
      const allArgs = JSON.stringify(track.mock.calls);
      expect(allArgs).not.toContain('bodyHtml');
      expect(allArgs).not.toContain('bodyJson');
    });
  });
});
