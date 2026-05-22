import { createAdminContentClient } from '@dragon/sdk';
import type {
  ApiClient,
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
  AdminPostListParams,
  AdminPageListParams,
} from '@dragon/sdk';

export async function listPosts(
  client: ApiClient,
  params?: AdminPostListParams,
): Promise<AdminPostListResponse> {
  return createAdminContentClient(client).listPosts(params);
}

export async function createPost(
  client: ApiClient,
  input: CreatePostRequest,
): Promise<AdminPostResponse> {
  return createAdminContentClient(client).createPost(input);
}

export async function getPost(client: ApiClient, id: string): Promise<AdminPostResponse> {
  return createAdminContentClient(client).getPost(id);
}

export async function updatePost(
  client: ApiClient,
  id: string,
  input: UpdatePostRequest,
): Promise<AdminPostResponse> {
  return createAdminContentClient(client).updatePost(id, input);
}

export async function previewPost(client: ApiClient, id: string): Promise<AdminPostResponse> {
  return createAdminContentClient(client).previewPost(id);
}

export async function publishPost(client: ApiClient, id: string): Promise<AdminPostResponse> {
  return createAdminContentClient(client).publishPost(id);
}

export async function archivePost(client: ApiClient, id: string): Promise<AdminPostResponse> {
  return createAdminContentClient(client).archivePost(id);
}

export async function softDeletePost(
  client: ApiClient,
  id: string,
): Promise<ContentGenericResponse> {
  return createAdminContentClient(client).softDeletePost(id);
}

export async function listPostRevisions(
  client: ApiClient,
  id: string,
): Promise<ContentRevisionListResponse> {
  return createAdminContentClient(client).listPostRevisions(id);
}

export async function getPostRevision(
  client: ApiClient,
  id: string,
  revisionId: string,
): Promise<ContentRevisionResponse> {
  return createAdminContentClient(client).getPostRevision(id, revisionId);
}

export async function listPages(
  client: ApiClient,
  params?: AdminPageListParams,
): Promise<AdminPageListResponse> {
  return createAdminContentClient(client).listPages(params);
}

export async function createPage(
  client: ApiClient,
  input: CreatePageRequest,
): Promise<AdminPageResponse> {
  return createAdminContentClient(client).createPage(input);
}

export async function getPage(client: ApiClient, id: string): Promise<AdminPageResponse> {
  return createAdminContentClient(client).getPage(id);
}

export async function updatePage(
  client: ApiClient,
  id: string,
  input: UpdatePageRequest,
): Promise<AdminPageResponse> {
  return createAdminContentClient(client).updatePage(id, input);
}

export async function previewPage(client: ApiClient, id: string): Promise<AdminPageResponse> {
  return createAdminContentClient(client).previewPage(id);
}

export async function publishPage(client: ApiClient, id: string): Promise<AdminPageResponse> {
  return createAdminContentClient(client).publishPage(id);
}

export async function archivePage(client: ApiClient, id: string): Promise<AdminPageResponse> {
  return createAdminContentClient(client).archivePage(id);
}

export async function softDeletePage(
  client: ApiClient,
  id: string,
): Promise<ContentGenericResponse> {
  return createAdminContentClient(client).softDeletePage(id);
}

export async function listPageRevisions(
  client: ApiClient,
  id: string,
): Promise<ContentRevisionListResponse> {
  return createAdminContentClient(client).listPageRevisions(id);
}

export async function getPageRevision(
  client: ApiClient,
  id: string,
  revisionId: string,
): Promise<ContentRevisionResponse> {
  return createAdminContentClient(client).getPageRevision(id, revisionId);
}

export async function listCategories(client: ApiClient): Promise<AdminCategoryListResponse> {
  return createAdminContentClient(client).listCategories();
}

export async function createCategory(
  client: ApiClient,
  input: CreateCategoryRequest,
): Promise<AdminCategoryResponse> {
  return createAdminContentClient(client).createCategory(input);
}

export async function updateCategory(
  client: ApiClient,
  id: string,
  input: UpdateCategoryRequest,
): Promise<AdminCategoryResponse> {
  return createAdminContentClient(client).updateCategory(id, input);
}

export async function deleteCategory(
  client: ApiClient,
  id: string,
): Promise<ContentGenericResponse> {
  return createAdminContentClient(client).deleteCategory(id);
}

export async function listTags(client: ApiClient): Promise<AdminTagListResponse> {
  return createAdminContentClient(client).listTags();
}

export async function createTag(
  client: ApiClient,
  input: CreateTagRequest,
): Promise<AdminTagResponse> {
  return createAdminContentClient(client).createTag(input);
}

export async function updateTag(
  client: ApiClient,
  id: string,
  input: UpdateTagRequest,
): Promise<AdminTagResponse> {
  return createAdminContentClient(client).updateTag(id, input);
}

export async function deleteTag(client: ApiClient, id: string): Promise<ContentGenericResponse> {
  return createAdminContentClient(client).deleteTag(id);
}
