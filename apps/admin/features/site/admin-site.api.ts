import { createAdminSiteClient } from '@dragon/sdk';
import type {
  ApiClient,
  AdminSiteSettingsResponse,
  UpdateSiteSettingsRequest,
  ContactMessageListResponse,
  ContactMessageResponse,
  SiteGenericResponse,
} from '@dragon/sdk';

export async function getSiteSettings(client: ApiClient): Promise<AdminSiteSettingsResponse> {
  return createAdminSiteClient(client).getSettings();
}

export async function updateSiteSettings(
  client: ApiClient,
  input: UpdateSiteSettingsRequest,
): Promise<AdminSiteSettingsResponse> {
  return createAdminSiteClient(client).updateSettings(input);
}

export async function listContactMessages(
  client: ApiClient,
  params?: { page?: number; limit?: number },
): Promise<ContactMessageListResponse> {
  return createAdminSiteClient(client).listMessages(params);
}

export async function getContactMessage(
  client: ApiClient,
  id: string,
): Promise<ContactMessageResponse> {
  return createAdminSiteClient(client).getMessage(id);
}

export async function deleteContactMessage(
  client: ApiClient,
  id: string,
): Promise<SiteGenericResponse> {
  return createAdminSiteClient(client).deleteMessage(id);
}
