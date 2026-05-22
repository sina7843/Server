import type { ApiClient } from './client';
import type {
  PublicPostListResponse,
  PublicPostResponse,
  PublicPageResponse,
  PublicCategoryListResponse,
  PublicCategoryResponse,
  PublicTagListResponse,
  PublicTagResponse,
} from '@dragon/types';

export interface ContentClient {
  listNews(params?: { page?: number; limit?: number }): Promise<PublicPostListResponse>;
  getNewsPost(slug: string): Promise<PublicPostResponse>;

  listArticles(params?: { page?: number; limit?: number }): Promise<PublicPostListResponse>;
  getArticle(slug: string): Promise<PublicPostResponse>;

  listAnnouncements(params?: { page?: number; limit?: number }): Promise<PublicPostListResponse>;
  getAnnouncement(slug: string): Promise<PublicPostResponse>;

  listGuides(params?: { page?: number; limit?: number }): Promise<PublicPostListResponse>;
  getGuide(slug: string): Promise<PublicPostResponse>;

  listRules(params?: { page?: number; limit?: number }): Promise<PublicPostListResponse>;
  getRule(slug: string): Promise<PublicPostResponse>;

  getPage(slug: string): Promise<PublicPageResponse>;

  listCategories(): Promise<PublicCategoryListResponse>;
  getCategory(slug: string): Promise<PublicCategoryResponse>;

  listTags(): Promise<PublicTagListResponse>;
  getTag(slug: string): Promise<PublicTagResponse>;
}

function buildPostListPath(base: string, params?: { page?: number; limit?: number }): string {
  const searchParams = new URLSearchParams();
  if (params?.page !== undefined) searchParams.set('page', String(params.page));
  if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return query ? `${base}?${query}` : base;
}

export function createContentClient(client: ApiClient): ContentClient {
  return {
    listNews(params) {
      return client.request<PublicPostListResponse>({
        method: 'GET',
        path: buildPostListPath('/api/v1/news', params),
      });
    },
    getNewsPost(slug) {
      return client.request<PublicPostResponse>({
        method: 'GET',
        path: `/api/v1/news/${encodeURIComponent(slug)}`,
      });
    },

    listArticles(params) {
      return client.request<PublicPostListResponse>({
        method: 'GET',
        path: buildPostListPath('/api/v1/articles', params),
      });
    },
    getArticle(slug) {
      return client.request<PublicPostResponse>({
        method: 'GET',
        path: `/api/v1/articles/${encodeURIComponent(slug)}`,
      });
    },

    listAnnouncements(params) {
      return client.request<PublicPostListResponse>({
        method: 'GET',
        path: buildPostListPath('/api/v1/announcements', params),
      });
    },
    getAnnouncement(slug) {
      return client.request<PublicPostResponse>({
        method: 'GET',
        path: `/api/v1/announcements/${encodeURIComponent(slug)}`,
      });
    },

    listGuides(params) {
      return client.request<PublicPostListResponse>({
        method: 'GET',
        path: buildPostListPath('/api/v1/guides', params),
      });
    },
    getGuide(slug) {
      return client.request<PublicPostResponse>({
        method: 'GET',
        path: `/api/v1/guides/${encodeURIComponent(slug)}`,
      });
    },

    listRules(params) {
      return client.request<PublicPostListResponse>({
        method: 'GET',
        path: buildPostListPath('/api/v1/rules', params),
      });
    },
    getRule(slug) {
      return client.request<PublicPostResponse>({
        method: 'GET',
        path: `/api/v1/rules/${encodeURIComponent(slug)}`,
      });
    },

    getPage(slug) {
      return client.request<PublicPageResponse>({
        method: 'GET',
        path: `/api/v1/pages/${encodeURIComponent(slug)}`,
      });
    },

    listCategories() {
      return client.request<PublicCategoryListResponse>({
        method: 'GET',
        path: '/api/v1/categories',
      });
    },
    getCategory(slug) {
      return client.request<PublicCategoryResponse>({
        method: 'GET',
        path: `/api/v1/categories/${encodeURIComponent(slug)}`,
      });
    },

    listTags() {
      return client.request<PublicTagListResponse>({
        method: 'GET',
        path: '/api/v1/tags',
      });
    },
    getTag(slug) {
      return client.request<PublicTagResponse>({
        method: 'GET',
        path: `/api/v1/tags/${encodeURIComponent(slug)}`,
      });
    },
  };
}
