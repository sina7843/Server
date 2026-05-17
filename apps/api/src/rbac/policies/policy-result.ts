export type PolicyDenyReason =
  | 'denied'
  | 'missing_context'
  | 'ownership_mismatch'
  | 'missing_permission';

export type PolicyAllowReason = 'allowed';

export interface PolicyResult {
  readonly allowed: boolean;
  readonly reason?: PolicyAllowReason | PolicyDenyReason;
}

export const allowPolicyResult = (): PolicyResult => ({
  allowed: true,
  reason: 'allowed',
});

export const denyPolicyResult = (reason: PolicyDenyReason = 'denied'): PolicyResult => ({
  allowed: false,
  reason,
});
