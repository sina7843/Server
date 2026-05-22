import { createAdminRbacClient } from '@dragon/sdk';
import type {
  ApiClient,
  AttachPermissionRequest,
  CreateRoleRequest,
  PermissionsListResponse,
  RbacGenericResponse,
  RolePermissionsResponse,
  RoleResponse,
  RolesListResponse,
  UpdateRoleRequest,
} from '@dragon/sdk';

export async function listRoles(client: ApiClient): Promise<RolesListResponse> {
  return createAdminRbacClient(client).listRoles();
}

export async function getRole(client: ApiClient, id: string): Promise<RoleResponse> {
  return createAdminRbacClient(client).getRole(id);
}

export async function createRole(
  client: ApiClient,
  input: CreateRoleRequest,
): Promise<RoleResponse> {
  return createAdminRbacClient(client).createRole(input);
}

export async function updateRole(
  client: ApiClient,
  id: string,
  input: UpdateRoleRequest,
): Promise<RoleResponse> {
  return createAdminRbacClient(client).updateRole(id, input);
}

export async function deactivateRole(client: ApiClient, id: string): Promise<RbacGenericResponse> {
  return createAdminRbacClient(client).deactivateRole(id);
}

export async function listRolePermissions(
  client: ApiClient,
  roleId: string,
): Promise<RolePermissionsResponse> {
  return createAdminRbacClient(client).listRolePermissions(roleId);
}

export async function listPermissions(
  client: ApiClient,
  params?: { module?: string; resource?: string },
): Promise<PermissionsListResponse> {
  return createAdminRbacClient(client).listPermissions(params);
}

export async function attachPermissionToRole(
  client: ApiClient,
  roleId: string,
  input: AttachPermissionRequest,
): Promise<RbacGenericResponse> {
  return createAdminRbacClient(client).attachPermissionToRole(roleId, input);
}

export async function detachPermissionFromRole(
  client: ApiClient,
  roleId: string,
  permissionId: string,
): Promise<RbacGenericResponse> {
  return createAdminRbacClient(client).detachPermissionFromRole(roleId, permissionId);
}
