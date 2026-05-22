import type { ApiClient } from './client';
import type {
  AdminPostListResponse,
  AdminPostResponse,
  AdminPageListResponse,
  AdminPageResponse,
  AdminCategoryListResponse,
  AdminCategoryResponse,
  AdminTagListResponse,
  AdminTagResponse,
  ContentRevisionListResponse,
  ContentRevisionResponse,
  ContentGenericResponse,
  CreatePostRequest,
  UpdatePostRequest,
  CreatePageRequest,
  UpdatePageRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateTagRequest,
  UpdateTagRequest,
} from '@dragon/types';

export interface AdminPostListParams {
  readonly type?: string;
  readonly status?: string;
  readonly includeDeleted?: boolean;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminPageListParams {
  readonly status?: string;
  readonly includeDeleted?: boolean;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminContentClient {
  listPosts(params?: AdminPostListParams): Promise<AdminPostListResponse>;
  createPost(input: CreatePostRequest): Promise<AdminPostResponse>;
  getPost(id: string): Promise<AdminPostResponse>;
  updatePost(id: string, input: UpdatePostRequest): Promise<AdminPostResponse>;
  previewPost(id: string): Promise<AdminPostResponse>;
  publishPost(id: string): Promise<AdminPostResponse>;
  archivePost(id: string): Promise<AdminPostResponse>;
  softDeletePost(id: string): Promise<ContentGenericResponse>;
  listPostRevisions(id: string): Promise<ContentRevisionListResponse>;
  getPostRevision(id: string, revisionId: string): Promise<ContentRevisionResponse>;

  listPages(params?: AdminPageListParams): Promise<AdminPageListResponse>;
  createPage(input: CreatePageRequest): Promise<AdminPageResponse>;
  getPage(id: string): Promise<AdminPageResponse>;
  updatePage(id: string, input: UpdatePageRequest): Promise<AdminPageResponse>;
  previewPage(id: string): Promise<AdminPageResponse>;
  publishPage(id: string): Promise<AdminPageResponse>;
  archivePage(id: string): Promise<AdminPageResponse>;
  softDeletePage(id: string): Promise<ContentGenericResponse>;
  listPageRevisions(id: string): Promise<ContentRevisionListResponse>;
  getPageRevision(id: string, revisionId: string): Promise<ContentRevisionResponse>;

  listCategories(): Promise<AdminCategoryListResponse>;
  createCategory(input: CreateCategoryRequest): Promise<AdminCategoryResponse>;
  updateCategory(id: string, input: UpdateCategoryRequest): Promise<AdminCategoryResponse>;
  deleteCategory(id: string): Promise<ContentGenericResponse>;

  listTags(): Promise<AdminTagListResponse>;
  createTag(input: CreateTagRequest): Promise<AdminTagResponse>;
  updateTag(id: string, input: UpdateTagRequest): Promise<AdminTagResponse>;
  deleteTag(id: string): Promise<ContentGenericResponse>;
}

function buildPostListPath(params?: AdminPostListParams): string {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.includeDeleted) searchParams.set('includeDeleted', 'true');
  if (params?.page !== undefined) searchParams.set('page', String(params.page));
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return query ? `/admin/v1/content/posts?${query}` : '/admin/v1/content/posts';
}

function buildPageListPath(params?: AdminPageListParams): string {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.includeDeleted) searchParams.set('includeDeleted', 'true');
  if (params?.page !== undefined) searchParams.set('page', String(params.page));
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return query ? `/admin/v1/content/pages?${query}` : '/admin/v1/content/pages';
}

export function createAdminContentClient(client: ApiClient): AdminContentClient {
  return {
    listPosts(params) {
      return client.request<AdminPostListResponse>({
        method: 'GET',
        path: buildPostListPath(params),
      });
    },
    createPost(input) {
      return client.request<AdminPostResponse>({
        method: 'POST',
        path: '/admin/v1/content/posts',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
    getPost(id) {
      return client.request<AdminPostResponse>({
        method: 'GET',
        path: `/admin/v1/content/posts/${encodeURIComponent(id)}`,
      });
    },
    updatePost(id, input) {
      return client.request<AdminPostResponse>({
        method: 'PATCH',
        path: `/admin/v1/content/posts/${encodeURIComponent(id)}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
    previewPost(id) {
      return client.request<AdminPostResponse>({
        method: 'POST',
        path: `/admin/v1/content/posts/${encodeURIComponent(id)}/preview`,
      });
    },
    publishPost(id) {
      return client.request<AdminPostResponse>({
        method: 'POST',
        path: `/admin/v1/content/posts/${encodeURIComponent(id)}/publish`,
      });
    },
    archivePost(id) {
      return client.request<AdminPostResponse>({
        method: 'POST',
        path: `/admin/v1/content/posts/${encodeURIComponent(id)}/archive`,
      });
    },
    softDeletePost(id) {
      return client.request<ContentGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/content/posts/${encodeURIComponent(id)}`,
      });
    },
    listPostRevisions(id) {
      return client.request<ContentRevisionListResponse>({
        method: 'GET',
        path: `/admin/v1/content/posts/${encodeURIComponent(id)}/revisions`,
      });
    },
    getPostRevision(id, revisionId) {
      return client.request<ContentRevisionResponse>({
        method: 'GET',
        path: `/admin/v1/content/posts/${encodeURIComponent(id)}/revisions/${encodeURIComponent(revisionId)}`,
      });
    },

    listPages(params) {
      return client.request<AdminPageListResponse>({
        method: 'GET',
        path: buildPageListPath(params),
      });
    },
    createPage(input) {
      return client.request<AdminPageResponse>({
        method: 'POST',
        path: '/admin/v1/content/pages',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
    getPage(id) {
      return client.request<AdminPageResponse>({
        method: 'GET',
        path: `/admin/v1/content/pages/${encodeURIComponent(id)}`,
      });
    },
    updatePage(id, input) {
      return client.request<AdminPageResponse>({
        method: 'PATCH',
        path: `/admin/v1/content/pages/${encodeURIComponent(id)}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
    previewPage(id) {
      return client.request<AdminPageResponse>({
        method: 'POST',
        path: `/admin/v1/content/pages/${encodeURIComponent(id)}/preview`,
      });
    },
    publishPage(id) {
      return client.request<AdminPageResponse>({
        method: 'POST',
        path: `/admin/v1/content/pages/${encodeURIComponent(id)}/publish`,
      });
    },
    archivePage(id) {
      return client.request<AdminPageResponse>({
        method: 'POST',
        path: `/admin/v1/content/pages/${encodeURIComponent(id)}/archive`,
      });
    },
    softDeletePage(id) {
      return client.request<ContentGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/content/pages/${encodeURIComponent(id)}`,
      });
    },
    listPageRevisions(id) {
      return client.request<ContentRevisionListResponse>({
        method: 'GET',
        path: `/admin/v1/content/pages/${encodeURIComponent(id)}/revisions`,
      });
    },
    getPageRevision(id, revisionId) {
      return client.request<ContentRevisionResponse>({
        method: 'GET',
        path: `/admin/v1/content/pages/${encodeURIComponent(id)}/revisions/${encodeURIComponent(revisionId)}`,
      });
    },

    listCategories() {
      return client.request<AdminCategoryListResponse>({
        method: 'GET',
        path: '/admin/v1/content/categories',
      });
    },
    createCategory(input) {
      return client.request<AdminCategoryResponse>({
        method: 'POST',
        path: '/admin/v1/content/categories',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
    updateCategory(id, input) {
      return client.request<AdminCategoryResponse>({
        method: 'PATCH',
        path: `/admin/v1/content/categories/${encodeURIComponent(id)}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
    deleteCategory(id) {
      return client.request<ContentGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/content/categories/${encodeURIComponent(id)}`,
      });
    },

    listTags() {
      return client.request<AdminTagListResponse>({
        method: 'GET',
        path: '/admin/v1/content/tags',
      });
    },
    createTag(input) {
      return client.request<AdminTagResponse>({
        method: 'POST',
        path: '/admin/v1/content/tags',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
    updateTag(id, input) {
      return client.request<AdminTagResponse>({
        method: 'PATCH',
        path: `/admin/v1/content/tags/${encodeURIComponent(id)}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },
    deleteTag(id) {
      return client.request<ContentGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/content/tags/${encodeURIComponent(id)}`,
      });
    },
  };
}
