export interface AuthSessionSummaryDto {
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
  readonly isCurrent?: boolean;
}

export interface AuthSessionsResponseDto {
  readonly sessions: readonly AuthSessionSummaryDto[];
}

type MutableAuthSessionSummary = {
  -readonly [Key in keyof AuthSessionSummaryDto]: AuthSessionSummaryDto[Key];
};

export interface SessionSummarySource {
  readonly _id: unknown;
  readonly deviceId?: string;
  readonly deviceName?: string;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly expiresAt: Date;
  readonly revokedAt?: Date | null;
  readonly revokedReason?: string;
  readonly lastUsedAt?: Date | null;
  readonly createdAt: Date;
}

export function createAuthSessionsResponse(input: {
  readonly sessions: readonly SessionSummarySource[];
  readonly currentSessionId?: string;
}): AuthSessionsResponseDto {
  return {
    sessions: input.sessions.map((session) =>
      createAuthSessionSummary(session, input.currentSessionId),
    ),
  };
}

function createAuthSessionSummary(
  session: SessionSummarySource,
  currentSessionId?: string,
): AuthSessionSummaryDto {
  const id = String(session._id);
  const summary: MutableAuthSessionSummary = {
    id,
    expiresAt: session.expiresAt.toISOString(),
    createdAt: session.createdAt.toISOString(),
  };

  if (session.deviceId !== undefined) {
    summary.deviceId = session.deviceId;
  }

  if (session.deviceName !== undefined) {
    summary.deviceName = session.deviceName;
  }

  if (session.ip !== undefined) {
    summary.ip = session.ip;
  }

  if (session.userAgent !== undefined) {
    summary.userAgent = session.userAgent;
  }

  if (session.revokedAt) {
    summary.revokedAt = session.revokedAt.toISOString();
  }

  if (session.revokedReason !== undefined) {
    summary.revokedReason = session.revokedReason;
  }

  if (session.lastUsedAt) {
    summary.lastUsedAt = session.lastUsedAt.toISOString();
  }

  if (currentSessionId !== undefined) {
    summary.isCurrent = id === currentSessionId;
  }

  return summary;
}
