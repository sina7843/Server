import { ref } from 'vue';
import type {
  AdminPostSummaryDto,
  AdminPostDetailDto,
  AdminPageSummaryDto,
  AdminPageDetailDto,
  AdminCategoryDto,
  AdminTagDto,
  ContentRevisionSummary,
  ContentRevisionDetailDto,
  AdminPostListParams,
  AdminPageListParams,
  CreatePostRequest,
  UpdatePostRequest,
  CreatePageRequest,
  UpdatePageRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateTagRequest,
  UpdateTagRequest,
} from '@dragon/sdk';
import * as contentApi from '~/features/content/admin-content.api';

// ─── Posts ───────────────────────────────────────────────────────────────────

const _posts = ref<readonly AdminPostSummaryDto[]>([]);
const _postsTotal = ref(0);
const _postsLoading = ref(false);
const _postsError = ref<string | null>(null);

const _post = ref<AdminPostDetailDto | null>(null);
const _postLoading = ref(false);
const _postError = ref<string | null>(null);

// ─── Pages ───────────────────────────────────────────────────────────────────

const _pages = ref<readonly AdminPageSummaryDto[]>([]);
const _pagesTotal = ref(0);
const _pagesLoading = ref(false);
const _pagesError = ref<string | null>(null);

const _page = ref<AdminPageDetailDto | null>(null);
const _pageLoading = ref(false);
const _pageError = ref<string | null>(null);

// ─── Categories ──────────────────────────────────────────────────────────────

const _categories = ref<readonly AdminCategoryDto[]>([]);
const _categoriesLoading = ref(false);
const _categoriesError = ref<string | null>(null);

// ─── Tags ────────────────────────────────────────────────────────────────────

const _tags = ref<readonly AdminTagDto[]>([]);
const _tagsLoading = ref(false);
const _tagsError = ref<string | null>(null);

// ─── Revisions ───────────────────────────────────────────────────────────────

const _revisions = ref<readonly ContentRevisionSummary[]>([]);
const _revisionsLoading = ref(false);
const _revisionsError = ref<string | null>(null);

const _revision = ref<ContentRevisionDetailDto | null>(null);
const _revisionLoading = ref(false);
const _revisionError = ref<string | null>(null);

// ─── Action state (shared) ───────────────────────────────────────────────────

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);
const _actionSuccess = ref<string | null>(null);

export function useAdminContent() {
  // ─── Posts ─────────────────────────────────────────────────────────────────

  async function loadPosts(params?: AdminPostListParams) {
    _postsLoading.value = true;
    _postsError.value = null;

    try {
      const res = await contentApi.listPosts(useAdminApiClient(), params);
      _posts.value = res.items;
      _postsTotal.value = res.total;
    } catch (err) {
      _postsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری محتوا.';
    } finally {
      _postsLoading.value = false;
    }
  }

  async function loadPost(id: string) {
    _post.value = null;
    _postLoading.value = true;
    _postError.value = null;

    try {
      const res = await contentApi.getPost(useAdminApiClient(), id);
      _post.value = res.post;
    } catch (err) {
      _postError.value = err instanceof Error ? err.message : 'خطا در بارگذاری محتوا.';
    } finally {
      _postLoading.value = false;
    }
  }

  async function createPost(input: CreatePostRequest): Promise<AdminPostDetailDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.createPost(useAdminApiClient(), input);
      _actionSuccess.value = 'محتوا ایجاد شد.';
      return res.post;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ایجاد محتوا.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updatePost(
    id: string,
    input: UpdatePostRequest,
  ): Promise<AdminPostDetailDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.updatePost(useAdminApiClient(), id, input);
      _post.value = res.post;
      _actionSuccess.value = 'تغییرات ذخیره شد.';
      return res.post;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ذخیره تغییرات.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function publishPost(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.publishPost(useAdminApiClient(), id);
      _post.value = res.post;
      _actionSuccess.value = 'محتوا منتشر شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در انتشار.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function archivePost(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.archivePost(useAdminApiClient(), id);
      _post.value = res.post;
      _actionSuccess.value = 'محتوا بایگانی شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در بایگانی.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function softDeletePost(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await contentApi.softDeletePost(useAdminApiClient(), id);
      _posts.value = _posts.value.filter((p) => p.id !== id);
      _actionSuccess.value = 'محتوا حذف شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  // ─── Pages ─────────────────────────────────────────────────────────────────

  async function loadPages(params?: AdminPageListParams) {
    _pagesLoading.value = true;
    _pagesError.value = null;

    try {
      const res = await contentApi.listPages(useAdminApiClient(), params);
      _pages.value = res.items;
      _pagesTotal.value = res.total;
    } catch (err) {
      _pagesError.value = err instanceof Error ? err.message : 'خطا در بارگذاری صفحات.';
    } finally {
      _pagesLoading.value = false;
    }
  }

  async function loadPage(id: string) {
    _page.value = null;
    _pageLoading.value = true;
    _pageError.value = null;

    try {
      const res = await contentApi.getPage(useAdminApiClient(), id);
      _page.value = res.page;
    } catch (err) {
      _pageError.value = err instanceof Error ? err.message : 'خطا در بارگذاری صفحه.';
    } finally {
      _pageLoading.value = false;
    }
  }

  async function createPage(input: CreatePageRequest): Promise<AdminPageDetailDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.createPage(useAdminApiClient(), input);
      _actionSuccess.value = 'صفحه ایجاد شد.';
      return res.page;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ایجاد صفحه.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updatePage(
    id: string,
    input: UpdatePageRequest,
  ): Promise<AdminPageDetailDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.updatePage(useAdminApiClient(), id, input);
      _page.value = res.page;
      _actionSuccess.value = 'تغییرات ذخیره شد.';
      return res.page;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ذخیره تغییرات.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function publishPage(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.publishPage(useAdminApiClient(), id);
      _page.value = res.page;
      _actionSuccess.value = 'صفحه منتشر شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در انتشار.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function archivePage(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.archivePage(useAdminApiClient(), id);
      _page.value = res.page;
      _actionSuccess.value = 'صفحه بایگانی شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در بایگانی.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function softDeletePage(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await contentApi.softDeletePage(useAdminApiClient(), id);
      _pages.value = _pages.value.filter((p) => p.id !== id);
      _actionSuccess.value = 'صفحه حذف شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  // ─── Categories ────────────────────────────────────────────────────────────

  async function loadCategories() {
    _categoriesLoading.value = true;
    _categoriesError.value = null;

    try {
      const res = await contentApi.listCategories(useAdminApiClient());
      _categories.value = res.items;
    } catch (err) {
      _categoriesError.value = err instanceof Error ? err.message : 'خطا در بارگذاری دسته‌ها.';
    } finally {
      _categoriesLoading.value = false;
    }
  }

  async function createCategory(input: CreateCategoryRequest): Promise<AdminCategoryDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.createCategory(useAdminApiClient(), input);
      _categories.value = [..._categories.value, res.category];
      _actionSuccess.value = 'دسته‌بندی ایجاد شد.';
      return res.category;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ایجاد دسته‌بندی.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updateCategory(
    id: string,
    input: UpdateCategoryRequest,
  ): Promise<AdminCategoryDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.updateCategory(useAdminApiClient(), id, input);
      _categories.value = _categories.value.map((c) => (c.id === id ? res.category : c));
      _actionSuccess.value = 'دسته‌بندی ویرایش شد.';
      return res.category;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ویرایش دسته‌بندی.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await contentApi.deleteCategory(useAdminApiClient(), id);
      _categories.value = _categories.value.filter((c) => c.id !== id);
      _actionSuccess.value = 'دسته‌بندی حذف شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف دسته‌بندی.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  // ─── Tags ──────────────────────────────────────────────────────────────────

  async function loadTags() {
    _tagsLoading.value = true;
    _tagsError.value = null;

    try {
      const res = await contentApi.listTags(useAdminApiClient());
      _tags.value = res.items;
    } catch (err) {
      _tagsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری برچسب‌ها.';
    } finally {
      _tagsLoading.value = false;
    }
  }

  async function createTag(input: CreateTagRequest): Promise<AdminTagDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.createTag(useAdminApiClient(), input);
      _tags.value = [..._tags.value, res.tag];
      _actionSuccess.value = 'برچسب ایجاد شد.';
      return res.tag;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ایجاد برچسب.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updateTag(id: string, input: UpdateTagRequest): Promise<AdminTagDto | null> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      const res = await contentApi.updateTag(useAdminApiClient(), id, input);
      _tags.value = _tags.value.map((t) => (t.id === id ? res.tag : t));
      _actionSuccess.value = 'برچسب ویرایش شد.';
      return res.tag;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ویرایش برچسب.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function deleteTag(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;
    _actionSuccess.value = null;

    try {
      await contentApi.deleteTag(useAdminApiClient(), id);
      _tags.value = _tags.value.filter((t) => t.id !== id);
      _actionSuccess.value = 'برچسب حذف شد.';
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف برچسب.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  // ─── Revisions ─────────────────────────────────────────────────────────────

  async function loadPostRevisions(postId: string) {
    _revisions.value = [];
    _revisionsLoading.value = true;
    _revisionsError.value = null;

    try {
      const res = await contentApi.listPostRevisions(useAdminApiClient(), postId);
      _revisions.value = res.revisions;
    } catch (err) {
      _revisionsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری تاریخچه.';
    } finally {
      _revisionsLoading.value = false;
    }
  }

  async function loadPageRevisions(pageId: string) {
    _revisions.value = [];
    _revisionsLoading.value = true;
    _revisionsError.value = null;

    try {
      const res = await contentApi.listPageRevisions(useAdminApiClient(), pageId);
      _revisions.value = res.revisions;
    } catch (err) {
      _revisionsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری تاریخچه.';
    } finally {
      _revisionsLoading.value = false;
    }
  }

  async function loadPostRevisionDetail(postId: string, revisionId: string) {
    _revision.value = null;
    _revisionLoading.value = true;
    _revisionError.value = null;

    try {
      const res = await contentApi.getPostRevision(useAdminApiClient(), postId, revisionId);
      _revision.value = res.revision;
    } catch (err) {
      _revisionError.value = err instanceof Error ? err.message : 'خطا در بارگذاری نسخه.';
    } finally {
      _revisionLoading.value = false;
    }
  }

  async function loadPageRevisionDetail(pageId: string, revisionId: string) {
    _revision.value = null;
    _revisionLoading.value = true;
    _revisionError.value = null;

    try {
      const res = await contentApi.getPageRevision(useAdminApiClient(), pageId, revisionId);
      _revision.value = res.revision;
    } catch (err) {
      _revisionError.value = err instanceof Error ? err.message : 'خطا در بارگذاری نسخه.';
    } finally {
      _revisionLoading.value = false;
    }
  }

  function clearActionState() {
    _actionLoading.value = false;
    _actionError.value = null;
    _actionSuccess.value = null;
  }

  return {
    // Posts
    posts: _posts,
    postsTotal: _postsTotal,
    postsLoading: _postsLoading,
    postsError: _postsError,
    post: _post,
    postLoading: _postLoading,
    postError: _postError,
    loadPosts,
    loadPost,
    createPost,
    updatePost,
    publishPost,
    archivePost,
    softDeletePost,

    // Pages
    pages: _pages,
    pagesTotal: _pagesTotal,
    pagesLoading: _pagesLoading,
    pagesError: _pagesError,
    page: _page,
    pageLoading: _pageLoading,
    pageError: _pageError,
    loadPages,
    loadPage,
    createPage,
    updatePage,
    publishPage,
    archivePage,
    softDeletePage,

    // Categories
    categories: _categories,
    categoriesLoading: _categoriesLoading,
    categoriesError: _categoriesError,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Tags
    tags: _tags,
    tagsLoading: _tagsLoading,
    tagsError: _tagsError,
    loadTags,
    createTag,
    updateTag,
    deleteTag,

    // Revisions
    revisions: _revisions,
    revisionsLoading: _revisionsLoading,
    revisionsError: _revisionsError,
    revision: _revision,
    revisionLoading: _revisionLoading,
    revisionError: _revisionError,
    loadPostRevisions,
    loadPageRevisions,
    loadPostRevisionDetail,
    loadPageRevisionDetail,

    // Action state
    actionLoading: _actionLoading,
    actionError: _actionError,
    actionSuccess: _actionSuccess,
    clearActionState,
  };
}
