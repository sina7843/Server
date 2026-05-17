export interface AuthContext {
  readonly userId: string;
  readonly sessionId: string;
  readonly accessTokenJti: string;
}

export interface AuthenticatedRequest {
  readonly headers?: Record<string, string | string[] | undefined>;
  auth?: AuthContext;
}
