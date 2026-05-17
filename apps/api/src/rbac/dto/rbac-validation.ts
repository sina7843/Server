import { BadRequestException } from '@nestjs/common';

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const ROLE_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const KNOWN_CREATE_ROLE_FIELDS = new Set(['key', 'name', 'description', 'isAssignable']);
const KNOWN_UPDATE_ROLE_FIELDS = new Set(['name', 'description', 'isAssignable', 'isActive']);
const KNOWN_ATTACH_PERMISSION_FIELDS = new Set(['permissionId']);
const KNOWN_ASSIGN_USER_ROLE_FIELDS = new Set(['roleId', 'scopeType', 'scopeId', 'expiresAt']);

export function validateObjectId(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !OBJECT_ID_PATTERN.test(value)) {
    throw new BadRequestException(`${fieldName} must be a valid ObjectId.`);
  }

  return value;
}

export function validateRoleKey(value: unknown): string {
  if (typeof value !== 'string' || !ROLE_KEY_PATTERN.test(value)) {
    throw new BadRequestException('Role key must use lowercase letters, numbers, and underscores.');
  }

  return value;
}

export function assertKnownFields(
  value: Record<string, unknown>,
  knownFields: ReadonlySet<string>,
): void {
  const unknownFields = Object.keys(value).filter((key) => !knownFields.has(key));

  if (unknownFields.length > 0) {
    throw new BadRequestException('Unknown RBAC fields are not allowed.');
  }
}

export function assertStringField(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return value.trim();
}

export function assertOptionalStringField(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName} must be a string.`);
  }

  return value.trim();
}

export function assertOptionalBooleanField(value: unknown, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${fieldName} must be a boolean.`);
  }

  return value;
}

export function assertOptionalDateField(value: unknown, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new BadRequestException(`${fieldName} must be a valid date string.`);
  }

  return value;
}

export interface ValidatedCreateRoleDto {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly isAssignable?: boolean;
}

export interface ValidatedUpdateRoleDto {
  readonly name?: string;
  readonly description?: string;
  readonly isAssignable?: boolean;
  readonly isActive?: boolean;
}

export interface ValidatedAttachPermissionDto {
  readonly permissionId: string;
}

export interface ValidatedAssignUserRoleDto {
  readonly roleId: string;
  readonly scopeType?: string;
  readonly scopeId?: string;
  readonly expiresAt?: string;
}

export function validateCreateRoleDto(value: Record<string, unknown>): ValidatedCreateRoleDto {
  assertKnownFields(value, KNOWN_CREATE_ROLE_FIELDS);

  const description = assertOptionalStringField(value.description, 'description');
  const isAssignable = assertOptionalBooleanField(value.isAssignable, 'isAssignable');

  return {
    key: validateRoleKey(value.key),
    name: assertStringField(value.name, 'name'),
    ...(description !== undefined ? { description } : {}),
    ...(isAssignable !== undefined ? { isAssignable } : {}),
  };
}

export function validateUpdateRoleDto(value: Record<string, unknown>): ValidatedUpdateRoleDto {
  assertKnownFields(value, KNOWN_UPDATE_ROLE_FIELDS);

  const name = assertOptionalStringField(value.name, 'name');
  const description = assertOptionalStringField(value.description, 'description');
  const isAssignable = assertOptionalBooleanField(value.isAssignable, 'isAssignable');
  const isActive = assertOptionalBooleanField(value.isActive, 'isActive');

  return {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(isAssignable !== undefined ? { isAssignable } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };
}

export function validateAttachPermissionDto(
  value: Record<string, unknown>,
): ValidatedAttachPermissionDto {
  assertKnownFields(value, KNOWN_ATTACH_PERMISSION_FIELDS);

  return {
    permissionId: validateObjectId(value.permissionId, 'permissionId'),
  };
}

export function validateAssignUserRoleDto(
  value: Record<string, unknown>,
): ValidatedAssignUserRoleDto {
  assertKnownFields(value, KNOWN_ASSIGN_USER_ROLE_FIELDS);

  const scopeType = assertOptionalStringField(value.scopeType, 'scopeType');
  const scopeId = assertOptionalStringField(value.scopeId, 'scopeId');
  const expiresAt = assertOptionalDateField(value.expiresAt, 'expiresAt');

  return {
    roleId: validateObjectId(value.roleId, 'roleId'),
    ...(scopeType !== undefined ? { scopeType } : {}),
    ...(scopeId !== undefined ? { scopeId } : {}),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
  };
}
