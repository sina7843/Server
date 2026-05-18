import type {
  MyUserProfileDto,
  PublicProfileResponseDto,
  UpdateMyProfileDto,
} from './profile-types';

export interface ProfileHttpClient {
  get<TResponse>(path: string): Promise<TResponse>;
  patch<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
  ): Promise<TResponse>;
}

export interface ProfilesClient {
  getPublicProfile(username: string): Promise<PublicProfileResponseDto>;
  getMyProfile(): Promise<MyUserProfileDto>;
  updateMyProfile(input: UpdateMyProfileDto): Promise<MyUserProfileDto>;
}

export function createProfilesClient(client: ProfileHttpClient): ProfilesClient {
  return {
    getPublicProfile(username: string) {
      return client.get<PublicProfileResponseDto>(
        `/api/v1/u/${encodeURIComponent(username)}`,
      );
    },

    getMyProfile() {
      return client.get<MyUserProfileDto>('/api/v1/me/profile');
    },

    updateMyProfile(input: UpdateMyProfileDto) {
      return client.patch<MyUserProfileDto, UpdateMyProfileDto>(
        '/api/v1/me/profile',
        input,
      );
    },
  };
}
