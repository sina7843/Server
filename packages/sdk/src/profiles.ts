import type { ApiClient } from './client';
import type {
  MyUserProfileDto,
  PublicProfileResponseDto,
  UpdateMyProfileDto,
} from './profile-types';

export interface ProfilesClient {
  getPublicProfile(username: string): Promise<PublicProfileResponseDto>;
  getMyProfile(): Promise<MyUserProfileDto>;
  updateMyProfile(input: UpdateMyProfileDto): Promise<MyUserProfileDto>;
  setAvatar(mediaAssetId: string): Promise<MyUserProfileDto>;
  uploadAvatar(file: File): Promise<MyUserProfileDto>;
  deleteAvatar(): Promise<MyUserProfileDto>;
}

export function createProfilesClient(client: ApiClient): ProfilesClient {
  return {
    getPublicProfile(username: string) {
      return client.request<PublicProfileResponseDto>({
        method: 'GET',
        path: `/api/v1/u/${encodeURIComponent(username)}`,
      });
    },

    getMyProfile() {
      return client.request<MyUserProfileDto>({
        method: 'GET',
        path: '/api/v1/me/profile',
      });
    },

    updateMyProfile(input: UpdateMyProfileDto) {
      return client.request<MyUserProfileDto>({
        method: 'PATCH',
        path: '/api/v1/me/profile',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(input),
      });
    },

    setAvatar(mediaAssetId: string) {
      return client.request<MyUserProfileDto>({
        method: 'POST',
        path: '/api/v1/me/avatar',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ mediaAssetId }),
      });
    },

    uploadAvatar(file: File) {
      const form = new FormData();
      form.append('file', file);
      return client.request<MyUserProfileDto>({
        method: 'POST',
        path: '/api/v1/me/avatar/upload',
        body: form,
      });
    },

    deleteAvatar() {
      return client.request<MyUserProfileDto>({
        method: 'DELETE',
        path: '/api/v1/me/avatar',
      });
    },
  };
}
