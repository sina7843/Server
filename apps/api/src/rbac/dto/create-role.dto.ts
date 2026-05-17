export class CreateRoleDto {
  readonly key!: string;
  readonly name!: string;
  readonly description?: string;
  readonly isAssignable?: boolean;
}
