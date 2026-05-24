import type { MyUserProfileDto } from './dto/my-profile-response.dto';
import type { PublicUserProfileDto } from './dto/public-profile-response.dto';
import type { ProfileAvatarData } from './avatar.service';
import type { UserProfileLike } from './profile.types';

export function toMyUserProfileDto(
  profile: UserProfileLike,
  avatarData?: ProfileAvatarData,
): MyUserProfileDto {
  return {
    username: profile.username,
    displayName: profile.displayName,
    ...(profile.avatarMediaId !== undefined
      ? { avatarMediaId: String(profile.avatarMediaId) }
      : {}),
    ...(avatarData ? { avatarUrl: avatarData.avatarUrl } : {}),
    ...(avatarData?.avatarVariants ? { avatarVariants: avatarData.avatarVariants } : {}),
    ...(profile.bio !== undefined ? { bio: profile.bio } : {}),
    visibility: profile.visibility,
    publicUrl: profile.publicUrl,
  };
}

export function toPublicUserProfileDto(
  profile: UserProfileLike,
  avatarData?: ProfileAvatarData,
): PublicUserProfileDto {
  return {
    username: profile.username,
    displayName: profile.displayName,
    ...(profile.avatarMediaId !== undefined
      ? { avatarMediaId: String(profile.avatarMediaId) }
      : {}),
    ...(avatarData ? { avatarUrl: avatarData.avatarUrl } : {}),
    ...(avatarData?.avatarVariants ? { avatarVariants: avatarData.avatarVariants } : {}),
    ...(profile.bio !== undefined ? { bio: profile.bio } : {}),
    visibility: 'public',
    publicUrl: profile.publicUrl,
  };
}
