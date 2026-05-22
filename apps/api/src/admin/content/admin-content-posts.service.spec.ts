import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminContentPostsService } from './admin-content-posts.service';
import { PostService } from '../../content/posts/post.service';
import { ContentRevisionService } from '../../content/revisions/content-revision.service';
import { RichTextValidator } from '../../content/rich-text/rich-text-validator';
import { HtmlSanitizer } from '../../content/rich-text/html-sanitizer';
import type { PostDocument } from '../../content/posts/post.schema';

type MockPostService = {
  [K in keyof PostService]: jest.Mock;
};
type MockRevisionService = {
  snapshot: jest.Mock;
  listByResource: jest.Mock;
  findById: jest.Mock;
};

function makePost(overrides: Partial<Record<string, unknown>> = {}): PostDocument {
  return {
    _id: '507f1f77bcf86cd799439011',
    type: 'news',
    title: 'Test Post',
    slug: 'test-post',
    slugNormalized: 'test-post',
    bodyJson: { type: 'doc', content: [] },
    bodyHtml: '<p>safe</p>',
    status: 'draft',
    categoryIds: [],
    tagIds: [],
    authorId: 'author1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as unknown as PostDocument;
}

const BASE_CREATE_INPUT = {
  type: 'news' as const,
  title: 'Test Post',
  slug: 'test-post',
  bodyJson: {} as Record<string, unknown>,
  bodyHtml: '<p>hello</p>',
  categoryIds: [] as string[],
  tagIds: [] as string[],
  seo: {},
};

describe('AdminContentPostsService — sanitization', () => {
  let service: AdminContentPostsService;
  let postService: MockPostService;
  let revisionService: MockRevisionService;
  let htmlSanitizer: HtmlSanitizer;
  let richTextValidator: RichTextValidator;
  let sanitizeSpy: jest.SpyInstance;

  beforeEach(async () => {
    postService = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateSlug: jest.fn(),
      markPublished: jest.fn(),
      markArchived: jest.fn(),
      softDelete: jest.fn(),
      list: jest.fn(),
      findByTypeAndSlug: jest.fn(),
      findPublishedByTypeAndSlug: jest.fn(),
      isSlugTaken: jest.fn(),
      validateStatus: jest.fn(),
    } as unknown as MockPostService;

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
        AdminContentPostsService,
        { provide: PostService, useValue: postService },
        { provide: ContentRevisionService, useValue: revisionService },
        { provide: HtmlSanitizer, useValue: htmlSanitizer },
        { provide: RichTextValidator, useValue: richTextValidator },
      ],
    }).compile();

    service = module.get(AdminContentPostsService);
  });

  // ─── createPost ──────────────────────────────────────────────────────────────

  describe('createPost', () => {
    it('sanitizes bodyHtml before storing', async () => {
      const rawHtml = '<script>alert("xss")</script><p>hello</p>';
      sanitizeSpy.mockReturnValue('<p>hello</p>');
      const post = makePost({ bodyHtml: '<p>hello</p>' });
      (postService.create as jest.Mock).mockResolvedValue(post);

      await service.createPost({ ...BASE_CREATE_INPUT, bodyHtml: rawHtml }, 'author1');

      expect(sanitizeSpy).toHaveBeenCalledWith(rawHtml);
      expect(postService.create).toHaveBeenCalledWith(
        expect.objectContaining({ bodyHtml: '<p>hello</p>' }),
      );
    });

    it('passes sanitized bodyHtml into revision snapshot', async () => {
      sanitizeSpy.mockReturnValue('<p>sanitized</p>');
      const post = makePost({ bodyHtml: '<p>sanitized</p>' });
      (postService.create as jest.Mock).mockResolvedValue(post);

      await service.createPost({ ...BASE_CREATE_INPUT, bodyHtml: '<p>raw</p>' }, 'author1');

      expect(revisionService.snapshot).toHaveBeenCalledWith(
        'post',
        String(post._id),
        expect.objectContaining({ bodyHtml: '<p>sanitized</p>' }),
        'author1',
      );
    });

    it('rejects invalid TipTap bodyJson (unknown node)', async () => {
      await expect(
        service.createPost(
          {
            ...BASE_CREATE_INPUT,
            bodyJson: { type: 'doc', content: [{ type: 'maliciousNode' }] },
          },
          'author1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects bodyJson with image node', async () => {
      await expect(
        service.createPost(
          {
            ...BASE_CREATE_INPUT,
            bodyJson: {
              type: 'doc',
              content: [{ type: 'image', attrs: { src: 'https://x.com/img.jpg' } }],
            },
          },
          'author1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts empty bodyJson ({}) without TipTap validation', async () => {
      sanitizeSpy.mockReturnValue('<p>ok</p>');
      const post = makePost();
      (postService.create as jest.Mock).mockResolvedValue(post);

      await expect(
        service.createPost({ ...BASE_CREATE_INPUT, bodyJson: {} }, 'author1'),
      ).resolves.toBeDefined();
    });

    it('never stores raw unsafe HTML (script removed from stored bodyHtml)', async () => {
      const rawHtml = '<script>evil()</script><p>content</p>';
      // Use real sanitizer (not mocked) to verify actual sanitization
      const realSanitizer = new HtmlSanitizer();
      jest.spyOn(htmlSanitizer, 'sanitize').mockImplementation((h) => realSanitizer.sanitize(h));

      let capturedBodyHtml = '';
      (postService.create as jest.Mock).mockImplementation((input: Record<string, unknown>) => {
        capturedBodyHtml = input.bodyHtml as string;
        return Promise.resolve(makePost({ bodyHtml: capturedBodyHtml }));
      });

      await service.createPost({ ...BASE_CREATE_INPUT, bodyHtml: rawHtml }, 'author1');

      expect(capturedBodyHtml).not.toContain('<script>');
      expect(capturedBodyHtml).not.toContain('evil');
      expect(capturedBodyHtml).toContain('<p>content</p>');
    });
  });

  // ─── updatePost ──────────────────────────────────────────────────────────────

  describe('updatePost', () => {
    it('sanitizes bodyHtml when updating', async () => {
      const rawHtml = '<script>xss</script><p>hello</p>';
      sanitizeSpy.mockReturnValue('<p>hello</p>');
      const post = makePost({ bodyHtml: '<p>hello</p>' });
      (postService.update as jest.Mock).mockResolvedValue(post);

      await service.updatePost('507f1f77bcf86cd799439011', { bodyHtml: rawHtml }, 'editor1');

      expect(sanitizeSpy).toHaveBeenCalledWith(rawHtml);
      expect(postService.update).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ bodyHtml: '<p>hello</p>' }),
      );
    });

    it('does not call sanitize when bodyHtml is not in update', async () => {
      const post = makePost();
      (postService.update as jest.Mock).mockResolvedValue(post);

      await service.updatePost('507f1f77bcf86cd799439011', { title: 'New title' }, 'editor1');

      expect(sanitizeSpy).not.toHaveBeenCalled();
    });

    it('rejects invalid TipTap bodyJson on update', async () => {
      await expect(
        service.updatePost(
          '507f1f77bcf86cd799439011',
          { bodyJson: { type: 'doc', content: [{ type: 'unknownBlock' }] } },
          'editor1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('snapshots revision with sanitized bodyHtml', async () => {
      sanitizeSpy.mockReturnValue('<p>safe</p>');
      const post = makePost({ bodyHtml: '<p>safe</p>' });
      (postService.update as jest.Mock).mockResolvedValue(post);

      await service.updatePost(
        '507f1f77bcf86cd799439011',
        { bodyHtml: '<script>evil</script><p>ok</p>' },
        'editor1',
      );

      expect(revisionService.snapshot).toHaveBeenCalledWith(
        'post',
        expect.any(String),
        expect.objectContaining({ bodyHtml: '<p>safe</p>' }),
        'editor1',
      );
    });
  });

  // ─── previewPost ─────────────────────────────────────────────────────────────

  describe('previewPost', () => {
    it('returns the stored post (bodyHtml already sanitized at create/update)', async () => {
      const post = makePost({ bodyHtml: '<p>already sanitized content</p>' });
      (postService.findById as jest.Mock).mockResolvedValue(post);

      const result = await service.previewPost('507f1f77bcf86cd799439011');

      expect(result.bodyHtml).toBe('<p>already sanitized content</p>');
      expect(sanitizeSpy).not.toHaveBeenCalled();
    });
  });

  // ─── Invariants ──────────────────────────────────────────────────────────────

  it('does not expose a restoreRevision method', () => {
    expect((service as unknown as Record<string, unknown>).restoreRevision).toBeUndefined();
  });
});
