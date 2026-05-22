import { ref } from 'vue';
import type {
  CreateRoleRequest,
  PermissionResponse,
  RoleResponse,
  UpdateRoleRequest,
} from '@dragon/sdk';
import * as rbacApi from '~/features/rbac/admin-rbac.api';

const _roles = ref<readonly RoleResponse[]>([]);
const _rolesLoading = ref(false);
const _rolesError = ref<string | null>(null);

const _role = ref<RoleResponse | null>(null);
const _roleLoading = ref(false);
const _roleError = ref<string | null>(null);

const _rolePermissions = ref<readonly PermissionResponse[]>([]);
const _rolePermissionsLoading = ref(false);
const _rolePermissionsError = ref<string | null>(null);

const _allPermissions = ref<readonly PermissionResponse[]>([]);
const _allPermissionsLoading = ref(false);
const _allPermissionsError = ref<string | null>(null);

const _actionLoading = ref(false);
const _actionError = ref<string | null>(null);

export function useAdminRoles() {
  async function loadRoles() {
    _rolesLoading.value = true;
    _rolesError.value = null;

    try {
      const res = await rbacApi.listRoles(useAdminApiClient());
      _roles.value = res.roles;
    } catch (err) {
      _rolesError.value = err instanceof Error ? err.message : 'خطا در بارگذاری نقش‌ها.';
    } finally {
      _rolesLoading.value = false;
    }
  }

  async function loadRole(id: string) {
    _role.value = null;
    _roleLoading.value = true;
    _roleError.value = null;

    try {
      const res = await rbacApi.getRole(useAdminApiClient(), id);
      _role.value = res;
    } catch (err) {
      _roleError.value = err instanceof Error ? err.message : 'خطا در بارگذاری نقش.';
    } finally {
      _roleLoading.value = false;
    }
  }

  async function loadRolePermissions(roleId: string) {
    _rolePermissions.value = [];
    _rolePermissionsLoading.value = true;
    _rolePermissionsError.value = null;

    try {
      const res = await rbacApi.listRolePermissions(useAdminApiClient(), roleId);
      _rolePermissions.value = res.permissions;
    } catch (err) {
      _rolePermissionsError.value =
        err instanceof Error ? err.message : 'خطا در بارگذاری مجوزهای نقش.';
    } finally {
      _rolePermissionsLoading.value = false;
    }
  }

  async function loadAllPermissions(params?: { module?: string; resource?: string }) {
    _allPermissionsLoading.value = true;
    _allPermissionsError.value = null;

    try {
      const res = await rbacApi.listPermissions(useAdminApiClient(), params);
      _allPermissions.value = res.permissions;
    } catch (err) {
      _allPermissionsError.value = err instanceof Error ? err.message : 'خطا در بارگذاری مجوزها.';
    } finally {
      _allPermissionsLoading.value = false;
    }
  }

  async function createRole(input: CreateRoleRequest): Promise<RoleResponse | null> {
    _actionLoading.value = true;
    _actionError.value = null;

    try {
      const res = await rbacApi.createRole(useAdminApiClient(), input);
      return res;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ایجاد نقش.';
      return null;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function updateRole(id: string, input: UpdateRoleRequest): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;

    try {
      const res = await rbacApi.updateRole(useAdminApiClient(), id, input);
      _role.value = res;
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در ویرایش نقش.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function deactivateRole(id: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;

    try {
      await rbacApi.deactivateRole(useAdminApiClient(), id);
      _roles.value = _roles.value.map((r) => (r.id === id ? { ...r, isActive: false } : r));
      if (_role.value?.id === id) {
        _role.value = { ..._role.value, isActive: false };
      }
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در غیرفعال‌سازی نقش.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function attachPermission(roleId: string, permissionId: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;

    try {
      await rbacApi.attachPermissionToRole(useAdminApiClient(), roleId, { permissionId });
      await loadRolePermissions(roleId);
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در افزودن مجوز.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  async function detachPermission(roleId: string, permissionId: string): Promise<boolean> {
    _actionLoading.value = true;
    _actionError.value = null;

    try {
      await rbacApi.detachPermissionFromRole(useAdminApiClient(), roleId, permissionId);
      _rolePermissions.value = _rolePermissions.value.filter((p) => p.id !== permissionId);
      return true;
    } catch (err) {
      _actionError.value = err instanceof Error ? err.message : 'خطا در حذف مجوز.';
      return false;
    } finally {
      _actionLoading.value = false;
    }
  }

  return {
    roles: _roles,
    rolesLoading: _rolesLoading,
    rolesError: _rolesError,

    role: _role,
    roleLoading: _roleLoading,
    roleError: _roleError,

    rolePermissions: _rolePermissions,
    rolePermissionsLoading: _rolePermissionsLoading,
    rolePermissionsError: _rolePermissionsError,

    allPermissions: _allPermissions,
    allPermissionsLoading: _allPermissionsLoading,
    allPermissionsError: _allPermissionsError,

    actionLoading: _actionLoading,
    actionError: _actionError,

    loadRoles,
    loadRole,
    loadRolePermissions,
    loadAllPermissions,
    createRole,
    updateRole,
    deactivateRole,
    attachPermission,
    detachPermission,
  };
}
