import type { ApiClient } from './client';
import type {
  AttachPermissionRequest,
  CreateRoleRequest,
  PermissionsListResponse,
  RbacGenericResponse,
  RolePermissionsResponse,
  RoleResponse,
  RolesListResponse,
  UpdateRoleRequest,
} from './admin-rbac-types';

export interface AdminRbacClient {
  listRoles(): Promise<RolesListResponse>;
  getRole(id: string): Promise<RoleResponse>;
  createRole(input: CreateRoleRequest): Promise<RoleResponse>;
  updateRole(id: string, input: UpdateRoleRequest): Promise<RoleResponse>;
  deactivateRole(id: string): Promise<RbacGenericResponse>;
  listRolePermissions(roleId: string): Promise<RolePermissionsResponse>;
  listPermissions(params?: {
    module?: string;
    resource?: string;
  }): Promise<PermissionsListResponse>;
  attachPermissionToRole(
    roleId: string,
    input: AttachPermissionRequest,
  ): Promise<RbacGenericResponse>;
  detachPermissionFromRole(roleId: string, permissionId: string): Promise<RbacGenericResponse>;
}

export function createAdminRbacClient(client: ApiClient): AdminRbacClient {
  return {
    listRoles() {
      return client.request<RolesListResponse>({ method: 'GET', path: '/admin/v1/roles' });
    },

    getRole(id) {
      return client.request<RoleResponse>({
        method: 'GET',
        path: `/admin/v1/roles/${encodeURIComponent(id)}`,
      });
    },

    createRole(input) {
      return client.request<RoleResponse>({
        method: 'POST',
        path: '/admin/v1/roles',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },

    updateRole(id, input) {
      return client.request<RoleResponse>({
        method: 'PATCH',
        path: `/admin/v1/roles/${encodeURIComponent(id)}`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },

    deactivateRole(id) {
      return client.request<RbacGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/roles/${encodeURIComponent(id)}`,
      });
    },

    listRolePermissions(roleId) {
      return client.request<RolePermissionsResponse>({
        method: 'GET',
        path: `/admin/v1/roles/${encodeURIComponent(roleId)}/permissions`,
      });
    },

    listPermissions(params) {
      const query = new URLSearchParams();
      if (params?.module) query.set('module', params.module);
      if (params?.resource) query.set('resource', params.resource);
      const qs = query.toString();
      return client.request<PermissionsListResponse>({
        method: 'GET',
        path: `/admin/v1/permissions${qs ? `?${qs}` : ''}`,
      });
    },

    attachPermissionToRole(roleId, input) {
      return client.request<RbacGenericResponse>({
        method: 'POST',
        path: `/admin/v1/roles/${encodeURIComponent(roleId)}/permissions`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      });
    },

    detachPermissionFromRole(roleId, permissionId) {
      return client.request<RbacGenericResponse>({
        method: 'DELETE',
        path: `/admin/v1/roles/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(permissionId)}`,
      });
    },
  };
}
