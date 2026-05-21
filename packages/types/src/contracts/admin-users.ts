export type AdminUserStatus =
  | 'pending_verification'
  | 'active'
  | 'suspended'
  | 'banned'
  | 'deleted';

export const ADMIN_USER_STATUSES: readonly AdminUserStatus[] = [
  'pending_verification',
  'active',
  'suspended',
  'banned',
  'deleted',
];

export type AdminProfileVisibility = 'public' | 'private';

export interface AdminUserProfileSummary {
  readonly username?: string;
  readonly displayName?: string;
  readonly bio?: string;
  readonly visibility?: AdminProfileVisibility;
  readonly publicUrl?: string;
}

export interface AdminUserListItem {
  readonly id: string;
  readonly status: AdminUserStatus;
  readonly phoneMasked?: string;
  readonly phoneVerified: boolean;
  readonly profile?: AdminUserProfileSummary;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminUsersListParams {
  readonly status?: AdminUserStatus;
  readonly q?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface AdminUsersListResponse {
  readonly users: readonly AdminUserListItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface AdminUserDetail {
  readonly id: string;
  readonly status: AdminUserStatus;
  readonly phoneMasked?: string;
  readonly phoneVerified: boolean;
  readonly lastLoginAt?: string;
  readonly profile?: AdminUserProfileSummary;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminUserDetailResponse {
  readonly user: AdminUserDetail;
}

export interface AdminUserStatusUpdateRequest {
  readonly status: AdminUserStatus;
  readonly reason?: string;
}

export interface AdminUserSessionSummary {
  readonly id: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly expiresAt: string;
  readonly revokedAt?: string;
  readonly revokedReason?: string;
  readonly lastUsedAt?: string;
  readonly createdAt: string;
  readonly isActive: boolean;
}

export interface AdminUserSessionsResponse {
  readonly sessions: readonly AdminUserSessionSummary[];
}

export interface AdminGenericResponse {
  readonly success: true;
  readonly message: string;
}
