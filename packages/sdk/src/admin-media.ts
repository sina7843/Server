import type { ApiClient } from './client';
import type {
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  AdminMediaUploadResponseDto,
  UpdateMediaAssetDto,
} from '@dragon/types';
import type {
  AdminMediaClient,
  AdminMediaListParams,
  AdminMediaUploadParams,
} from './admin-media-types';

export function createAdminMediaClient(client: ApiClient): AdminMediaClient {
  return {
    listMedia(params?: AdminMediaListParams): Promise<AdminMediaListResponseDto> {
      const search = new URLSearchParams();
      if (params?.visibility) search.set('visibility', params.visibility);
      if (params?.status) search.set('status', params.status);
      if (params?.mimeType) search.set('mimeType', params.mimeType);
      if (params?.page !== undefined) search.set('page', String(params.page));
      if (params?.limit !== undefined) search.set('limit', String(params.limit));
      const qs = search.toString();
      return client.request<AdminMediaListResponseDto>({
        method: 'GET',
        path: `/admin/v1/media${qs ? `?${qs}` : ''}`,
      });
    },

    uploadMedia(params: AdminMediaUploadParams): Promise<AdminMediaUploadResponseDto> {
      const form = new FormData();
      const blob =
        params.file instanceof Blob
          ? params.file
          : new Blob([params.file as Uint8Array], { type: params.mimeType });
      form.append('file', blob, params.filename);
      if (params.visibility) form.append('visibility', params.visibility);
      if (params.alt) form.append('alt', params.alt);
      if (params.caption) form.append('caption', params.caption);
      return client.request<AdminMediaUploadResponseDto>({
        method: 'POST',
        path: '/admin/v1/media/upload',
        body: form,
      });
    },

    getMedia(id: string): Promise<AdminMediaAssetDto> {
      return client.request<AdminMediaAssetDto>({
        method: 'GET',
        path: `/admin/v1/media/${encodeURIComponent(id)}`,
      });
    },

    updateMedia(id: string, input: UpdateMediaAssetDto): Promise<AdminMediaAssetDto> {
      return client.request<AdminMediaAssetDto>({
        method: 'PATCH',
        path: `/admin/v1/media/${encodeURIComponent(id)}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },

    regenerateVariants(id: string): Promise<AdminMediaAssetDto> {
      return client.request<AdminMediaAssetDto>({
        method: 'POST',
        path: `/admin/v1/media/${encodeURIComponent(id)}/regenerate-variants`,
      });
    },

    deleteMedia(id: string): Promise<void> {
      return client.request<void>({
        method: 'DELETE',
        path: `/admin/v1/media/${encodeURIComponent(id)}`,
      });
    },
  };
}
