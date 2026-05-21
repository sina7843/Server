import { ApiClientError, createAdminRbacClient, createApiClient } from '@dragon/sdk';
import type {
  AttachPermissionRequest,
  CreateRoleRequest,
  PermissionsListResponse,
  RbacGenericResponse,
  RolePermissionsResponse,
  RoleResponse,
  RolesListResponse,
  UpdateRoleRequest,
} from '@dragon/sdk';
import { useAdminAuthState } from '~/composables/useAdminAuthState';

function getAdminRbacClient() {
  const { accessToken } = useAdminAuthState();

  if (!accessToken.value) {
    throw new ApiClientError('Not authenticated.', 401);
  }

  const client = createApiClient({
    baseUrl: '/',
    headers: { Authorization: `Bearer ${accessToken.value}` },
  });

  return createAdminRbacClient(client);
}

export async function listRoles(): Promise<RolesListResponse> {
  return getAdminRbacClient().listRoles();
}

export async function getRole(id: string): Promise<RoleResponse> {
  return getAdminRbacClient().getRole(id);
}

export async function createRole(input: CreateRoleRequest): Promise<RoleResponse> {
  return getAdminRbacClient().createRole(input);
}

export async function updateRole(id: string, input: UpdateRoleRequest): Promise<RoleResponse> {
  return getAdminRbacClient().updateRole(id, input);
}

export async function deactivateRole(id: string): Promise<RbacGenericResponse> {
  return getAdminRbacClient().deactivateRole(id);
}

export async function listRolePermissions(roleId: string): Promise<RolePermissionsResponse> {
  return getAdminRbacClient().listRolePermissions(roleId);
}

export async function listPermissions(params?: {
  module?: string;
  resource?: string;
}): Promise<PermissionsListResponse> {
  return getAdminRbacClient().listPermissions(params);
}

export async function attachPermissionToRole(
  roleId: string,
  input: AttachPermissionRequest,
): Promise<RbacGenericResponse> {
  return getAdminRbacClient().attachPermissionToRole(roleId, input);
}

export async function detachPermissionFromRole(
  roleId: string,
  permissionId: string,
): Promise<RbacGenericResponse> {
  return getAdminRbacClient().detachPermissionFromRole(roleId, permissionId);
}
