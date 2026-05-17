export interface AuthCleanupOptions {
  readonly now?: Date;
  readonly pendingUserCleanupAfterHours?: number;
}

export interface AuthCleanupResult {
  readonly pendingUsersMarkedDeleted: number;
  readonly expiredOtpChallengesCleaned: number;
  readonly expiredSessionsMarkedExpired: number;
}
