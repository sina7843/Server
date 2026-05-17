import type { PolicyContext } from './policy-context';

export interface BasicPolicyOptions {
  readonly requireOwnership?: boolean;
  readonly requiredPermission?: string;
}

export interface ObjectPolicyMetadata extends BasicPolicyOptions {
  readonly contextKey?: string;
}

export interface RequestWithPolicyContext {
  readonly auth?: {
    readonly userId?: string;
    readonly sessionId?: string;
    readonly accessTokenJti?: string;
  };
  readonly policyContext?: Partial<PolicyContext>;
  readonly [key: string]: unknown;
}
