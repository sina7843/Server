export interface PolicyContext {
  readonly userId?: string;
  readonly permissionKeys?: readonly string[];
  readonly roleKeys?: readonly string[];

  readonly scopeType?: string;
  readonly scopeId?: string;

  readonly resourceOwnerId?: string;
  readonly resourceId?: string;
  readonly resourceType?: string;

  readonly resource?: unknown;
}
