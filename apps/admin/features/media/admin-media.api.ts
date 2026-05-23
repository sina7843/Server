import { createAdminMediaClient } from '@dragon/sdk';
import type {
  ApiClient,
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  AdminMediaUploadResponseDto,
  UpdateMediaAssetDto,
  AdminMediaListParams,
  AdminMediaUploadParams,
} from '@dragon/sdk';

export async function listMedia(
  client: ApiClient,
  params?: AdminMediaListParams,
): Promise<AdminMediaListResponseDto> {
  return createAdminMediaClient(client).listMedia(params);
}

export async function uploadMedia(
  client: ApiClient,
  params: AdminMediaUploadParams,
): Promise<AdminMediaUploadResponseDto> {
  return createAdminMediaClient(client).uploadMedia(params);
}

export async function getMedia(client: ApiClient, id: string): Promise<AdminMediaAssetDto> {
  return createAdminMediaClient(client).getMedia(id);
}

export async function updateMedia(
  client: ApiClient,
  id: string,
  input: UpdateMediaAssetDto,
): Promise<AdminMediaAssetDto> {
  return createAdminMediaClient(client).updateMedia(id, input);
}

export async function regenerateVariants(
  client: ApiClient,
  id: string,
): Promise<AdminMediaAssetDto> {
  return createAdminMediaClient(client).regenerateVariants(id);
}

export async function deleteMedia(client: ApiClient, id: string): Promise<void> {
  return createAdminMediaClient(client).deleteMedia(id);
}
