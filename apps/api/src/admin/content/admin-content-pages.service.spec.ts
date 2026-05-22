import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminContentPagesService } from './admin-content-pages.service';
import { PageService } from '../../content/pages/page.service';
import { ContentRevisionService } from '../../content/revisions/content-revision.service';
import { RichTextValidator } from '../../content/rich-text/rich-text-validator';
import { HtmlSanitizer } from '../../content/rich-text/html-sanitizer';
import type { PageDocument } from '../../content/pages/page.schema';

type MockPageService = {
  [K in keyof PageService]: jest.Mock;
};
type MockRevisionService = {
  snapshot: jest.Mock;
  listByResource: jest.Mock;
  findById: jest.Mock;
};

function makePage(overrides: Partial<Record<string, unknown>> = {}): PageDocument {
  return {
    _id: '507f1f77bcf86cd799439022',
    title: 'Test Page',
    slug: 'test-page',
    slugNormalized: 'test-page',
    bodyJson: { type: 'doc', content: [] },
    bodyHtml: '<p>safe page content</p>',
    status: 'draft',
    createdBy: 'author1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    seo: {},
    ...overrides,
  } as unknown as PageDocument;
}

const BASE_CREATE_INPUT = {
  title: 'Test Page',
  slug: 'test-page',
  bodyJson: {} as Record<string, unknown>,
  bodyHtml: '<p>page content</p>',
  seo: {},
};

describe('AdminContentPagesService — sanitization', () => {
  let service: AdminContentPagesService;
  let pageService: MockPageService;
  let revisionService: MockRevisionService;
  let htmlSanitizer: HtmlSanitizer;
  let richTextValidator: RichTextValidator;
  let sanitizeSpy: jest.SpyInstance;

  beforeEach(async () => {
    pageService = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateSlug: jest.fn(),
      markPublished: jest.fn(),
      markArchived: jest.fn(),
      softDelete: jest.fn(),
      list: jest.fn(),
      findBySlug: jest.fn(),
      findPublishedBySlug: jest.fn(),
      isSlugTaken: jest.fn(),
      validateStatus: jest.fn(),
    } as unknown as MockPageService;

    revisionService = {
      snapshot: jest.fn().mockResolvedValue(undefined),
      listByResource: jest.fn(),
      findById: jest.fn(),
    };

    htmlSanitizer = new HtmlSanitizer();
    richTextValidator = new RichTextValidator();
    sanitizeSpy = jest.spyOn(htmlSanitizer, 'sanitize');

    const module = await Test.createTestingModule({
      providers: [
        AdminContentPagesService,
        { provide: PageService, useValue: pageService },
        { provide: ContentRevisionService, useValue: revisionService },
        { provide: HtmlSanitizer, useValue: htmlSanitizer },
        { provide: RichTextValidator, useValue: richTextValidator },
      ],
    }).compile();

    service = module.get(AdminContentPagesService);
  });

  // ─── createPage ──────────────────────────────────────────────────────────────

  describe('createPage', () => {
    it('sanitizes bodyHtml before storing', async () => {
      const rawHtml = '<script>alert("xss")</script><p>page</p>';
      sanitizeSpy.mockReturnValue('<p>page</p>');
      const page = makePage({ bodyHtml: '<p>page</p>' });
      (pageService.create as jest.Mock).mockResolvedValue(page);

      await service.createPage({ ...BASE_CREATE_INPUT, bodyHtml: rawHtml }, 'author1');

      expect(sanitizeSpy).toHaveBeenCalledWith(rawHtml);
      expect(pageService.create).toHaveBeenCalledWith(
        expect.objectContaining({ bodyHtml: '<p>page</p>' }),
      );
    });

    it('passes sanitized bodyHtml into revision snapshot', async () => {
      sanitizeSpy.mockReturnValue('<p>sanitized page</p>');
      const page = makePage({ bodyHtml: '<p>sanitized page</p>' });
      (pageService.create as jest.Mock).mockResolvedValue(page);

      await service.createPage({ ...BASE_CREATE_INPUT, bodyHtml: '<p>raw</p>' }, 'author1');

      expect(revisionService.snapshot).toHaveBeenCalledWith(
        'page',
        String(page._id),
        expect.objectContaining({ bodyHtml: '<p>sanitized page</p>' }),
        'author1',
      );
    });

    it('rejects invalid TipTap bodyJson (image node)', async () => {
      await expect(
        service.createPage(
          {
            ...BASE_CREATE_INPUT,
            bodyJson: {
              type: 'doc',
              content: [{ type: 'image', attrs: { src: 'https://x.com' } }],
            },
          },
          'author1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects bodyJson with unknown node type', async () => {
      await expect(
        service.createPage(
          {
            ...BASE_CREATE_INPUT,
            bodyJson: { type: 'doc', content: [{ type: 'customWidget' }] },
          },
          'author1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts empty bodyJson ({}) without validation', async () => {
      sanitizeSpy.mockReturnValue('<p>ok</p>');
      const page = makePage();
      (pageService.create as jest.Mock).mockResolvedValue(page);

      await expect(
        service.createPage({ ...BASE_CREATE_INPUT, bodyJson: {} }, 'author1'),
      ).resolves.toBeDefined();
    });

    it('never stores raw unsafe HTML', async () => {
      const rawHtml = '<script>evil()</script><p>page content</p>';
      const realSanitizer = new HtmlSanitizer();
      jest.spyOn(htmlSanitizer, 'sanitize').mockImplementation((h) => realSanitizer.sanitize(h));

      let capturedBodyHtml = '';
      (pageService.create as jest.Mock).mockImplementation((input: Record<string, unknown>) => {
        capturedBodyHtml = input.bodyHtml as string;
        return Promise.resolve(makePage({ bodyHtml: capturedBodyHtml }));
      });

      await service.createPage({ ...BASE_CREATE_INPUT, bodyHtml: rawHtml }, 'author1');

      expect(capturedBodyHtml).not.toContain('<script>');
      expect(capturedBodyHtml).not.toContain('evil');
    });
  });

  // ─── updatePage ──────────────────────────────────────────────────────────────

  describe('updatePage', () => {
    it('sanitizes bodyHtml when updating', async () => {
      const rawHtml = '<script>xss</script><p>page update</p>';
      sanitizeSpy.mockReturnValue('<p>page update</p>');
      const page = makePage({ bodyHtml: '<p>page update</p>' });
      (pageService.update as jest.Mock).mockResolvedValue(page);

      await service.updatePage('507f1f77bcf86cd799439022', { bodyHtml: rawHtml }, 'editor1');

      expect(sanitizeSpy).toHaveBeenCalledWith(rawHtml);
      expect(pageService.update).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ bodyHtml: '<p>page update</p>' }),
      );
    });

    it('does not call sanitize when bodyHtml is absent from update', async () => {
      const page = makePage();
      (pageService.update as jest.Mock).mockResolvedValue(page);

      await service.updatePage('507f1f77bcf86cd799439022', { title: 'New title' }, 'editor1');

      expect(sanitizeSpy).not.toHaveBeenCalled();
    });

    it('rejects invalid TipTap bodyJson on update', async () => {
      await expect(
        service.updatePage(
          '507f1f77bcf86cd799439022',
          { bodyJson: { type: 'doc', content: [{ type: 'iframe' }] } },
          'editor1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('snapshots revision with sanitized bodyHtml', async () => {
      sanitizeSpy.mockReturnValue('<p>safe page</p>');
      const page = makePage({ bodyHtml: '<p>safe page</p>' });
      (pageService.update as jest.Mock).mockResolvedValue(page);

      await service.updatePage(
        '507f1f77bcf86cd799439022',
        { bodyHtml: '<script>evil</script><p>ok</p>' },
        'editor1',
      );

      expect(revisionService.snapshot).toHaveBeenCalledWith(
        'page',
        expect.any(String),
        expect.objectContaining({ bodyHtml: '<p>safe page</p>' }),
        'editor1',
      );
    });
  });

  // ─── previewPage ─────────────────────────────────────────────────────────────

  describe('previewPage', () => {
    it('returns the stored page (bodyHtml already sanitized at create/update)', async () => {
      const page = makePage({ bodyHtml: '<p>already safe page content</p>' });
      (pageService.findById as jest.Mock).mockResolvedValue(page);

      const result = await service.previewPage('507f1f77bcf86cd799439022');

      expect(result.bodyHtml).toBe('<p>already safe page content</p>');
      expect(sanitizeSpy).not.toHaveBeenCalled();
    });
  });

  // ─── Invariants ──────────────────────────────────────────────────────────────

  it('does not expose a restoreRevision method', () => {
    expect((service as unknown as Record<string, unknown>).restoreRevision).toBeUndefined();
  });
});
