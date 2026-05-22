/* global afterEach, beforeEach, describe, expect, fetch, it, jest */
import type { INestApplication } from '@nestjs/common';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminContentPostsController } from '../src/admin/content/admin-content-posts.controller';
import { AdminContentPagesController } from '../src/admin/content/admin-content-pages.controller';
import { AdminContentCategoriesController } from '../src/admin/content/admin-content-categories.controller';
import { AdminContentTagsController } from '../src/admin/content/admin-content-tags.controller';
import { AdminContentPostsService } from '../src/admin/content/admin-content-posts.service';
import { AdminContentPagesService } from '../src/admin/content/admin-content-pages.service';
import { CategoryService } from '../src/content/categories/category.service';
import { TagService } from '../src/content/tags/tag.service';
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard';
import { PermissionGuard } from '../src/rbac/guards/permission.guard';

const ADMIN_USER_ID = 'admin-user-id-1';

function makeRequest(app: INestApplication, method: string, path: string, body?: unknown) {
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return fetch(
    `http://127.0.0.1:${(app.getHttpServer() as { address(): { port: number } }).address().port}${path}`,
    init,
  );
}

const mockPostsService = {
  listPosts: jest.fn(),
  createPost: jest.fn(),
  getPost: jest.fn(),
  updatePost: jest.fn(),
  previewPost: jest.fn(),
  publishPost: jest.fn(),
  archivePost: jest.fn(),
  softDeletePost: jest.fn(),
  listPostRevisions: jest.fn(),
  getPostRevision: jest.fn(),
};

const mockPagesService = {
  listPages: jest.fn(),
  createPage: jest.fn(),
  getPage: jest.fn(),
  updatePage: jest.fn(),
  previewPage: jest.fn(),
  publishPage: jest.fn(),
  archivePage: jest.fn(),
  softDeletePage: jest.fn(),
  listPageRevisions: jest.fn(),
  getPageRevision: jest.fn(),
};

const mockCategoryService = {
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockTagService = {
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'post-id-1',
    type: 'news',
    title: 'Test Post',
    slug: 'test-post',
    slugNormalized: 'test-post',
    bodyHtml: '<p>Body</p>',
    bodyJson: { type: 'doc', content: [] },
    categoryIds: [],
    tagIds: [],
    seo: {},
    status: 'draft',
    authorId: ADMIN_USER_ID,
    publishedAt: null,
    deletedAt: undefined,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makePage(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'page-id-1',
    title: 'About',
    slug: 'about',
    slugNormalized: 'about',
    bodyHtml: '<p>About us</p>',
    bodyJson: { type: 'doc', content: [] },
    seo: {},
    status: 'draft',
    createdBy: ADMIN_USER_ID,
    publishedAt: null,
    deletedAt: undefined,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeCategory(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'cat-id-1',
    name: 'Technology',
    slug: 'technology',
    slugNormalized: 'technology',
    sortOrder: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeTag(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'tag-id-1',
    name: 'TypeScript',
    slug: 'typescript',
    slugNormalized: 'typescript',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeRevision(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'rev-id-1',
    resourceType: 'post',
    resourceId: 'post-id-1',
    snapshot: { title: 'Test Post', status: 'draft' },
    createdBy: ADMIN_USER_ID,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}

describe('Admin content APIs', () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [
        AdminContentPostsController,
        AdminContentPagesController,
        AdminContentCategoriesController,
        AdminContentTagsController,
      ],
      providers: [
        { provide: AdminContentPostsService, useValue: mockPostsService },
        { provide: AdminContentPagesService, useValue: mockPagesService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: TagService, useValue: mockTagService },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({
        canActivate: (ctx: { switchToHttp(): { getRequest(): Record<string, unknown> } }) => {
          const req = ctx.switchToHttp().getRequest();
          req['auth'] = { userId: ADMIN_USER_ID, sessionId: 'session-1', accessTokenJti: 'jti-1' };
          return true;
        },
      })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
  });

  afterEach(async () => {
    await app.close();
  });

  // ─── Posts ───────────────────────────────────────────────────────────────────

  describe('GET /admin/v1/content/posts', () => {
    it('lists posts and returns paginated response', async () => {
      const post = makePost();
      mockPostsService.listPosts.mockResolvedValue({ items: [post], total: 1 });

      const res = await makeRequest(app, 'GET', '/admin/v1/content/posts');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[]; total: number };
      expect(body.total).toBe(1);
      expect(Array.isArray(body.items)).toBe(true);
    });

    it('passes query params to service', async () => {
      mockPostsService.listPosts.mockResolvedValue({ items: [], total: 0 });
      await makeRequest(
        app,
        'GET',
        '/admin/v1/content/posts?type=news&status=draft&page=2&limit=10',
      );
      expect(mockPostsService.listPosts).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'news', status: 'draft', page: 2, limit: 10 }),
      );
    });
  });

  describe('POST /admin/v1/content/posts', () => {
    it('creates a post and returns it', async () => {
      const post = makePost();
      mockPostsService.createPost.mockResolvedValue(post);

      const res = await makeRequest(app, 'POST', '/admin/v1/content/posts', {
        type: 'news',
        title: 'Test Post',
        slug: 'test-post',
        bodyJson: { type: 'doc', content: [] },
        bodyHtml: '<p>Body</p>',
        categoryIds: [],
        tagIds: [],
        seo: {},
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { post: { title: string } };
      expect(body.post.title).toBe('Test Post');
    });
  });

  describe('GET /admin/v1/content/posts/:id', () => {
    it('returns a post by id', async () => {
      const post = makePost();
      mockPostsService.getPost.mockResolvedValue(post);

      const res = await makeRequest(app, 'GET', '/admin/v1/content/posts/507f1f77bcf86cd799439011');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { post: { slug: string } };
      expect(body.post.slug).toBe('test-post');
    });

    it('returns 404 for missing post', async () => {
      mockPostsService.getPost.mockRejectedValue(new NotFoundException('Post not found.'));
      const res = await makeRequest(app, 'GET', '/admin/v1/content/posts/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid id', async () => {
      mockPostsService.getPost.mockRejectedValue(new BadRequestException('Invalid id.'));
      const res = await makeRequest(app, 'GET', '/admin/v1/content/posts/not-a-valid-id');
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /admin/v1/content/posts/:id', () => {
    it('updates a post and returns it', async () => {
      const post = makePost({ title: 'Updated Title' });
      mockPostsService.updatePost.mockResolvedValue(post);

      const res = await makeRequest(
        app,
        'PATCH',
        '/admin/v1/content/posts/507f1f77bcf86cd799439011',
        {
          title: 'Updated Title',
        },
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { post: { title: string } };
      expect(body.post.title).toBe('Updated Title');
    });
  });

  describe('POST /admin/v1/content/posts/:id/publish', () => {
    it('publishes a post', async () => {
      const post = makePost({ status: 'published', publishedAt: new Date('2025-06-01') });
      mockPostsService.publishPost.mockResolvedValue(post);

      const res = await makeRequest(
        app,
        'POST',
        '/admin/v1/content/posts/507f1f77bcf86cd799439011/publish',
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as { post: { status: string } };
      expect(body.post.status).toBe('published');
    });
  });

  describe('POST /admin/v1/content/posts/:id/archive', () => {
    it('archives a post', async () => {
      const post = makePost({ status: 'archived' });
      mockPostsService.archivePost.mockResolvedValue(post);

      const res = await makeRequest(
        app,
        'POST',
        '/admin/v1/content/posts/507f1f77bcf86cd799439011/archive',
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as { post: { status: string } };
      expect(body.post.status).toBe('archived');
    });
  });

  describe('DELETE /admin/v1/content/posts/:id', () => {
    it('soft-deletes a post and returns success', async () => {
      mockPostsService.softDeletePost.mockResolvedValue(makePost({ deletedAt: new Date() }));

      const res = await makeRequest(
        app,
        'DELETE',
        '/admin/v1/content/posts/507f1f77bcf86cd799439011',
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
    });
  });

  describe('GET /admin/v1/content/posts/:id/revisions', () => {
    it('returns revision list for a post', async () => {
      mockPostsService.listPostRevisions.mockResolvedValue([makeRevision()]);

      const res = await makeRequest(
        app,
        'GET',
        '/admin/v1/content/posts/507f1f77bcf86cd799439011/revisions',
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { revisions: unknown[] };
      expect(Array.isArray(body.revisions)).toBe(true);
      expect(body.revisions).toHaveLength(1);
    });

    it('returns 404 when post not found', async () => {
      mockPostsService.listPostRevisions.mockRejectedValue(
        new NotFoundException('Post not found.'),
      );
      const res = await makeRequest(
        app,
        'GET',
        '/admin/v1/content/posts/507f1f77bcf86cd799439011/revisions',
      );
      expect(res.status).toBe(404);
    });
  });

  describe('GET /admin/v1/content/posts/:id/revisions/:revisionId', () => {
    it('returns a specific revision', async () => {
      const rev = makeRevision();
      mockPostsService.getPostRevision.mockResolvedValue(rev);

      const res = await makeRequest(
        app,
        'GET',
        '/admin/v1/content/posts/507f1f77bcf86cd799439011/revisions/507f1f77bcf86cd799439012',
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { revision: { resourceType: string } };
      expect(body.revision.resourceType).toBe('post');
    });
  });

  // ─── Pages ───────────────────────────────────────────────────────────────────

  describe('GET /admin/v1/content/pages', () => {
    it('lists pages and returns paginated response', async () => {
      mockPagesService.listPages.mockResolvedValue({ items: [makePage()], total: 1 });

      const res = await makeRequest(app, 'GET', '/admin/v1/content/pages');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[]; total: number };
      expect(body.total).toBe(1);
    });
  });

  describe('POST /admin/v1/content/pages', () => {
    it('creates a page and returns it', async () => {
      const page = makePage();
      mockPagesService.createPage.mockResolvedValue(page);

      const res = await makeRequest(app, 'POST', '/admin/v1/content/pages', {
        title: 'About',
        slug: 'about',
        bodyJson: { type: 'doc', content: [] },
        bodyHtml: '<p>About us</p>',
        seo: {},
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { page: { title: string } };
      expect(body.page.title).toBe('About');
    });
  });

  describe('POST /admin/v1/content/pages/:id/publish', () => {
    it('publishes a page', async () => {
      const page = makePage({ status: 'published', publishedAt: new Date('2025-06-01') });
      mockPagesService.publishPage.mockResolvedValue(page);

      const res = await makeRequest(
        app,
        'POST',
        '/admin/v1/content/pages/507f1f77bcf86cd799439011/publish',
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as { page: { status: string } };
      expect(body.page.status).toBe('published');
    });
  });

  describe('DELETE /admin/v1/content/pages/:id', () => {
    it('soft-deletes a page and returns success', async () => {
      mockPagesService.softDeletePage.mockResolvedValue(makePage({ deletedAt: new Date() }));

      const res = await makeRequest(
        app,
        'DELETE',
        '/admin/v1/content/pages/507f1f77bcf86cd799439011',
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
    });
  });

  // ─── Categories ───────────────────────────────────────────────────────────────

  describe('GET /admin/v1/content/categories', () => {
    it('lists categories including deleted ones', async () => {
      mockCategoryService.list.mockResolvedValue([makeCategory()]);

      const res = await makeRequest(app, 'GET', '/admin/v1/content/categories');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
      expect(mockCategoryService.list).toHaveBeenCalledWith(true);
    });
  });

  describe('POST /admin/v1/content/categories', () => {
    it('creates a category', async () => {
      const cat = makeCategory();
      mockCategoryService.create.mockResolvedValue(cat);

      const res = await makeRequest(app, 'POST', '/admin/v1/content/categories', {
        name: 'Technology',
        slug: 'technology',
        sortOrder: 0,
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { category: { name: string } };
      expect(body.category.name).toBe('Technology');
    });
  });

  describe('PATCH /admin/v1/content/categories/:id', () => {
    it('updates a category', async () => {
      const cat = makeCategory({ name: 'Tech' });
      mockCategoryService.update.mockResolvedValue(cat);

      const res = await makeRequest(
        app,
        'PATCH',
        '/admin/v1/content/categories/507f1f77bcf86cd799439011',
        {
          name: 'Tech',
        },
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { category: { name: string } };
      expect(body.category.name).toBe('Tech');
    });

    it('returns 404 when category not found', async () => {
      mockCategoryService.update.mockResolvedValue(null);

      const res = await makeRequest(
        app,
        'PATCH',
        '/admin/v1/content/categories/507f1f77bcf86cd799439011',
        {
          name: 'Tech',
        },
      );
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /admin/v1/content/categories/:id', () => {
    it('soft-deletes a category and returns success', async () => {
      mockCategoryService.softDelete.mockResolvedValue(undefined);

      const res = await makeRequest(
        app,
        'DELETE',
        '/admin/v1/content/categories/507f1f77bcf86cd799439011',
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
    });
  });

  // ─── Tags ─────────────────────────────────────────────────────────────────────

  describe('GET /admin/v1/content/tags', () => {
    it('lists tags including deleted ones', async () => {
      mockTagService.list.mockResolvedValue([makeTag()]);

      const res = await makeRequest(app, 'GET', '/admin/v1/content/tags');
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: unknown[] };
      expect(Array.isArray(body.items)).toBe(true);
      expect(mockTagService.list).toHaveBeenCalledWith(true);
    });
  });

  describe('POST /admin/v1/content/tags', () => {
    it('creates a tag', async () => {
      const tag = makeTag();
      mockTagService.create.mockResolvedValue(tag);

      const res = await makeRequest(app, 'POST', '/admin/v1/content/tags', {
        name: 'TypeScript',
        slug: 'typescript',
      });
      expect(res.status).toBe(201);
      const body = (await res.json()) as { tag: { name: string } };
      expect(body.tag.name).toBe('TypeScript');
    });
  });

  describe('PATCH /admin/v1/content/tags/:id', () => {
    it('updates a tag', async () => {
      const tag = makeTag({ name: 'TS' });
      mockTagService.update.mockResolvedValue(tag);

      const res = await makeRequest(
        app,
        'PATCH',
        '/admin/v1/content/tags/507f1f77bcf86cd799439011',
        {
          name: 'TS',
        },
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { tag: { name: string } };
      expect(body.tag.name).toBe('TS');
    });

    it('returns 404 when tag not found', async () => {
      mockTagService.update.mockResolvedValue(null);

      const res = await makeRequest(
        app,
        'PATCH',
        '/admin/v1/content/tags/507f1f77bcf86cd799439011',
        {
          name: 'TS',
        },
      );
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /admin/v1/content/tags/:id', () => {
    it('soft-deletes a tag and returns success', async () => {
      mockTagService.softDelete.mockResolvedValue(undefined);

      const res = await makeRequest(
        app,
        'DELETE',
        '/admin/v1/content/tags/507f1f77bcf86cd799439011',
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { success: boolean };
      expect(body.success).toBe(true);
    });
  });

  // ─── No restore endpoint ──────────────────────────────────────────────────────

  describe('No restore endpoint', () => {
    it('POST /admin/v1/content/posts/:id/revisions/:revisionId/restore returns 404', async () => {
      const res = await makeRequest(
        app,
        'POST',
        '/admin/v1/content/posts/507f1f77bcf86cd799439011/revisions/507f1f77bcf86cd799439012/restore',
      );
      expect(res.status).toBe(404);
    });

    it('POST /admin/v1/content/pages/:id/revisions/:revisionId/restore returns 404', async () => {
      const res = await makeRequest(
        app,
        'POST',
        '/admin/v1/content/pages/507f1f77bcf86cd799439011/revisions/507f1f77bcf86cd799439012/restore',
      );
      expect(res.status).toBe(404);
    });
  });
});
