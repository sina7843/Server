import type { ApiClient } from './client';
import type {
  PublicSiteSettingsResponse,
  SubmitContactMessageRequest,
  SubmitContactMessageResponse,
} from '@dragon/types';

export interface SiteClient {
  getSettings(): Promise<PublicSiteSettingsResponse>;
  submitContactMessage(body: SubmitContactMessageRequest): Promise<SubmitContactMessageResponse>;
}

export function createSiteClient(client: ApiClient): SiteClient {
  return {
    getSettings() {
      return client.request<PublicSiteSettingsResponse>({
        method: 'GET',
        path: '/api/v1/site/settings',
      });
    },
    submitContactMessage(body) {
      return client.request<SubmitContactMessageResponse>({
        method: 'POST',
        path: '/api/v1/site/contact-messages',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
  };
}
