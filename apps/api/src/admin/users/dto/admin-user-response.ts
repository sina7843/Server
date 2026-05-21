import { maskPhone } from '../../../auth/security/masking';
import type { UserDocument } from '../../../auth/users/user.schema';
import type { SessionDocument } from '../../../auth/sessions/session.schema';
import type { UserProfileDocument } from '../../../profiles/profile.schema';

export interface AdminUserListItemDto {
  readonly id: string;
  readonly status: string;
  readonly phoneMasked: string;
  readonly phoneVerified: boolean;
  readonly profile?: {
    readonly username: string;
    readonly displayName: string;
    readonly publicUrl: string;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminUserDetailDto {
  readonly id: string;
  readonly status: string;
  readonly phoneMasked: string;
  readonly phoneVerified: boolean;
  readonly lastLoginAt?: string;
  readonly profile?: {
    readonly username: string;
    readonly displayName: string;
    readonly bio?: string;
    readonly visibility: string;
    readonly publicUrl: string;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminUsersListResponseDto {
  readonly users: readonly AdminUserListItemDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface AdminUserDetailResponseDto {
  readonly user: AdminUserDetailDto;
}

export interface AdminUserSessionDto {
  readonly id: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
  readonly userAgent?: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
  readonly revokedReason?: string;
  readonly lastUsedAt?: string;
  readonly createdAt: string;
  readonly isActive: boolean;
}

export interface AdminUserSessionsResponseDto {
  readonly sessions: readonly AdminUserSessionDto[];
}

export interface AdminGenericResponseDto {
  readonly success: true;
  readonly message: string;
}

export function toAdminUserListItem(
  user: UserDocument,
  profile: UserProfileDocument | null,
): AdminUserListItemDto {
  return {
    id: String(user._id),
    status: user.status,
    phoneMasked: maskPhone(user.phoneNormalized),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    ...(profile
      ? {
          profile: {
            username: profile.username,
            displayName: profile.displayName,
            publicUrl: profile.publicUrl,
          },
        }
      : {}),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toAdminUserDetail(
  user: UserDocument,
  profile: UserProfileDocument | null,
): AdminUserDetailDto {
  return {
    id: String(user._id),
    status: user.status,
    phoneMasked: maskPhone(user.phoneNormalized),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    ...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt.toISOString() } : {}),
    ...(profile
      ? {
          profile: {
            username: profile.username,
            displayName: profile.displayName,
            ...(profile.bio ? { bio: profile.bio } : {}),
            visibility: profile.visibility,
            publicUrl: profile.publicUrl,
          },
        }
      : {}),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toAdminSessionDto(session: SessionDocument, now = new Date()): AdminUserSessionDto {
  const isActive = !session.revokedAt && session.expiresAt > now;

  return {
    id: String(session._id),
    ...(session.deviceId ? { deviceId: session.deviceId } : {}),
    ...(session.deviceName ? { deviceName: session.deviceName } : {}),
    ...(session.userAgent ? { userAgent: session.userAgent } : {}),
    expiresAt: session.expiresAt.toISOString(),
    ...(session.revokedAt ? { revokedAt: session.revokedAt.toISOString() } : {}),
    ...(session.revokedReason ? { revokedReason: session.revokedReason } : {}),
    ...(session.lastUsedAt ? { lastUsedAt: session.lastUsedAt.toISOString() } : {}),
    createdAt: session.createdAt.toISOString(),
    isActive,
  };
}
