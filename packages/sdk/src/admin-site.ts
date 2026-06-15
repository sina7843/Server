import type { ApiClient } from './client';
import type {
  AdminSiteSettingsResponse,
  ContactMessageListResponse,
  ContactMessageResponse,
  SiteGenericResponse,
  UpdateSiteSettingsRequest,
} from '@dragon/types';

export interface AdminSiteClient {
  getSettings(): Promise<AdminSiteSettingsResponse>;
  updateSettings(body: UpdateSiteSettingsRequest): Promise<AdminSiteSettingsResponse>;
  listMessages(params?: { page?: number; limit?: number }): Promise<ContactMessageListResponse>;
  getMessage(id: string): Promise<ContactMessageResponse>;
  deleteMessage(id: string): Promise<SiteGenericResponse>;
}

export function createAdminSiteClient(client: ApiClient): AdminSiteClient {
  return {
    getSettings() {
      return client.request<AdminSiteSettingsResponse>({
        method: 'GET',
        path: '/admin/v1/site/settings',
      });
    },
    updateSettings(body) {
      return client.request<AdminSiteSettingsResponse>({
        method: 'PUT',
        path: '/admin/v1/site/settings',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    listMessages(params) {
      const sp = new URLSearchParams();
      if (params?.page !== undefined) sp.set('page', String(params.page));
      if (params?.limit !== undefined) sp.set('limit', String(params.limit));
      const q = sp.toString();
      return client.request<ContactMessageListResponse>({
        method: 'GET',
        path: q ? `/admin/v1/site/contact-messages?${q}` : '/admin/v1/site/contact-messages',
      });
    },
    getMessage(id) {
      return client.request<ContactMessageResponse>({
        method: 'GET',
        path: `/admin/v1/site/contact-messages/${encodeURIComponent(id)}`,
      });
    },
    deleteMessage(id) {
      return client.request<SiteGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/site/contact-messages/${encodeURIComponent(id)}`,
      });
    },
  };
}
