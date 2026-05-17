export interface RbacSeedOptions {
  readonly bootstrapSuperAdminPhone?: string;
  readonly assignedAt?: Date;
}

export interface RbacSeedResult {
  readonly permissionsCreated: number;
  readonly permissionsUpdated: number;
  readonly rolesCreated: number;
  readonly rolesUpdated: number;
  readonly rolePermissionsAttached: number;
  readonly superAdminAssignmentCreated: number;
  readonly skipped: readonly string[];
}

export interface UpsertSeedResult<TDocument> {
  readonly document: TDocument;
  readonly created: boolean;
  readonly updated: boolean;
}

export interface AttachSeedResult<TDocument> {
  readonly document: TDocument;
  readonly created: boolean;
}
