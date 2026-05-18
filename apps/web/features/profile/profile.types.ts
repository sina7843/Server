import type {
  MyUserProfileDto,
  PrivateProfileStateDto,
  ProfileErrorStateDto,
  ProfileNotFoundStateDto,
  ProfileVisibility,
  PublicProfileResponseDto,
  PublicUserProfileDto,
  UpdateMyProfileDto,
} from '@dragon/types';

export type {
  MyUserProfileDto,
  PrivateProfileStateDto,
  ProfileErrorStateDto,
  ProfileNotFoundStateDto,
  ProfileVisibility,
  PublicProfileResponseDto,
  PublicUserProfileDto,
  UpdateMyProfileDto,
};

export type PublicProfilePageState =
  | { readonly status: 'loading' }
  | { readonly status: 'public'; readonly profile: PublicUserProfileDto }
  | { readonly status: 'private' }
  | { readonly status: 'not_found' }
  | { readonly status: 'error'; readonly message: string };

export interface ProfileValidationResult {
  readonly valid: boolean;
  readonly errors: Record<string, string>;
}
