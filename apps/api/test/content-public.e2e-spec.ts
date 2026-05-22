/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PublicNewsController } from '../src/content/public/public-news.controller';
import { PublicArticlesController } from '../src/content/public/public-articles.controller';
import { PublicAnnouncementsController } from '../src/content/public/public-announcements.controller';
import { PublicGuidesController } from '../src/content/public/public-guides.controller';
import { PublicRulesController } from '../src/content/public/public-rules.controller';
import { PublicPagesController } from '../src/content/public/public-pages.controller';
import { PublicCategoriesController } from '../src/content/public/public-categories.controller';
import { PublicTagsController } from '../src/content/public/public-tags.controller';
import { PublicPostsService } from '../src/content/public/public-posts.service';
import { PostService } from '../src/content/posts/post.service';
import { PageService } from '../src/content/pages/page.service';
import { CategoryService } from '../src/content/categories/category.service';
import { TagService } from '../src/content/tags/tag.service';

const mockPublicPostsService = {
  listPublished: jest.fn(),
  getPublished: jest.fn(),
};

const mockPageService = {
  findPublishedBySlug: jest.fn(),
};

const mockCategoryService = {
  list: jest.fn(),
  findBySlug: jest.fn(),
};

const mockTagService = {
  list: jest.fn(),
  findBySlug: jest.fn(),
};

function makePublishedPost(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'post-id-1',
    type: 'news',
    title: 'Test News',
    slug: 'test-news',
    slugNormalized: 'test-news',
    bodyHtml: '<p>Hello</p>',
    bodyJson: {},
    categoryIds: [],
    tagIds: [],
    seo: {},
    status: 'published',
    authorId: 'user-id',
    publishedAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makePublishedPage() {
  return {
    _id: 'page-id-1',
    title: 'About',
    slug: 'about',
    slugNormalized: 'about',
    bodyHtml: '<p>About us</p>',
    bodyJson: {},
    seo: {},
    status: 'published',
    createdBy: 'user-id',
    publishedAt: new Date('2025-01-01'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };
}

describe('Public content APIs', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [
        PublicNewsController,
        PublicArticlesController,
        PublicAnnouncementsController,
        PublicGuidesController,
        PublicRulesController,
        PublicPagesController,
        PublicCategoriesController,
        PublicTagsController,
      ],
      providers: [
        { provide: PublicPostsService, useValue: mockPublicPostsService },
        { provide: PostService, useValue: {} },
        { provide: PageService, useValue: mockPageService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TagService, useValue: mockTagService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/news', () => {
    it('returns only published news', async () => {
      const post = makePublishedPost();
      mockPublicPostsService.listPublished.mockResolvedValue({
        items: [post],
        total: 1,
        page: 1,
        limit: 20,
      });

      const res = await fetch(`${await app.getUrl()}/api/v1/news`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[]; total: number };
      expect(body.total).toBe(1);
      expect(Array.isArray(body.items)).toBe(true);
      expect(mockPublicPostsService.listPublished).toHaveBeenCalledWith('news', expect.any(Object));
    });

    it('list is type-scoped — uses type news', async () => {
      mockPublicPostsService.listPublished.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      await fetch(`${await app.getUrl()}/api/v1/news`);
      expect(mockPublicPostsService.listPublished).toHaveBeenCalledWith('news', expect.any(Object));
    });
  });

  describe('GET /api/v1/news/:slug', () => {
    it('returns a published news post by slug', async () => {
      const post = makePublishedPost();
      mockPublicPostsService.getPublished.mockResolvedValue(post);

      const res = await fetch(`${await app.getUrl()}/api/v1/news/test-news`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { post: { type: string } };
      expect(body.post.type).toBe('news');
      expect(mockPublicPostsService.getPublished).toHaveBeenCalledWith('news', 'test-news');
    });

    it('returns 404 for missing news post', async () => {
      mockPublicPostsService.getPublished.mockRejectedValue(
        new NotFoundException('Post not found.'),
      );

      const res = await fetch(`${await app.getUrl()}/api/v1/news/not-found`);
      expect(res.status).toBe(404);
    });
  });

  describe('Type-specific routes use correct type', () => {
    it('GET /api/v1/articles uses type article', async () => {
      mockPublicPostsService.listPublished.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      await fetch(`${await app.getUrl()}/api/v1/articles`);
      expect(mockPublicPostsService.listPublished).toHaveBeenCalledWith(
        'article',
        expect.any(Object),
      );
    });

    it('GET /api/v1/announcements uses type announcement', async () => {
      mockPublicPostsService.listPublished.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      await fetch(`${await app.getUrl()}/api/v1/announcements`);
      expect(mockPublicPostsService.listPublished).toHaveBeenCalledWith(
        'announcement',
        expect.any(Object),
      );
    });

    it('GET /api/v1/guides uses type guide', async () => {
      mockPublicPostsService.listPublished.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      await fetch(`${await app.getUrl()}/api/v1/guides`);
      expect(mockPublicPostsService.listPublished).toHaveBeenCalledWith(
        'guide',
        expect.any(Object),
      );
    });

    it('GET /api/v1/rules uses type rule', async () => {
      mockPublicPostsService.listPublished.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      });
      await fetch(`${await app.getUrl()}/api/v1/rules`);
      expect(mockPublicPostsService.listPublished).toHaveBeenCalledWith('rule', expect.any(Object));
    });
  });

  describe('No generic /posts route', () => {
    it('GET /api/v1/posts returns 404 — no generic post route', async () => {
      const res = await fetch(`${await app.getUrl()}/api/v1/posts`);
      expect(res.status).toBe(404);
    });

    it('GET /api/v1/posts/my-slug returns 404 — no generic post route', async () => {
      const res = await fetch(`${await app.getUrl()}/api/v1/posts/my-slug`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/pages/:slug', () => {
    it('returns a published page by slug', async () => {
      const page = makePublishedPage();
      mockPageService.findPublishedBySlug.mockResolvedValue(page);

      const res = await fetch(`${await app.getUrl()}/api/v1/pages/about`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { page: { title: string } };
      expect(body.page.title).toBe('About');
    });

    it('returns 404 for missing page', async () => {
      mockPageService.findPublishedBySlug.mockResolvedValue(null);

      const res = await fetch(`${await app.getUrl()}/api/v1/pages/does-not-exist`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('returns public categories', async () => {
      mockCategoryService.list.mockResolvedValue([
        {
          _id: 'cat-id',
          name: 'Tech',
          slug: 'tech',
          slugNormalized: 'tech',
          sortOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await fetch(`${await app.getUrl()}/api/v1/categories`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
      expect(mockCategoryService.list).toHaveBeenCalledWith(false);
    });
  });

  describe('GET /api/v1/tags', () => {
    it('returns public tags', async () => {
      mockTagService.list.mockResolvedValue([
        {
          _id: 'tag-id',
          name: 'TypeScript',
          slug: 'typescript',
          slugNormalized: 'typescript',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await fetch(`${await app.getUrl()}/api/v1/tags`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
      expect(mockTagService.list).toHaveBeenCalledWith(false);
    });
  });
});
