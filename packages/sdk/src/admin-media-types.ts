import type {
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  AdminMediaUploadResponseDto,
  UpdateMediaAssetDto,
} from '@dragon/types';

export type {
  AdminMediaAssetDto,
  AdminMediaListResponseDto,
  AdminMediaUploadResponseDto,
  UpdateMediaAssetDto,
};

export interface AdminMediaListParams {
  readonly visibility?: 'public' | 'private';
  readonly status?: 'uploaded' | 'processing' | 'ready' | 'failed';
  readonly mimeType?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminMediaUploadParams {
  readonly file: Blob | Uint8Array;
  readonly filename: string;
  readonly mimeType: string;
  readonly visibility?: 'public' | 'private';
  readonly alt?: string;
  readonly caption?: string;
}

export interface AdminMediaClient {
  listMedia(params?: AdminMediaListParams): Promise<AdminMediaListResponseDto>;
  uploadMedia(params: AdminMediaUploadParams): Promise<AdminMediaUploadResponseDto>;
  getMedia(id: string): Promise<AdminMediaAssetDto>;
  updateMedia(id: string, input: UpdateMediaAssetDto): Promise<AdminMediaAssetDto>;
  regenerateVariants(id: string): Promise<AdminMediaAssetDto>;
  deleteMedia(id: string): Promise<void>;
}
