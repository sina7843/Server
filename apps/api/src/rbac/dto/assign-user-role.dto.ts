export class AssignUserRoleDto {
  readonly roleId!: string;
  readonly scopeType?: string;
  readonly scopeId?: string;
  readonly expiresAt?: string;
}
