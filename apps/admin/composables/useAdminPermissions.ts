import { computed, ref } from 'vue';
import { DragonPermissions } from '@dragon/sdk';
import { filterNavByPermissions, ADMIN_NAV_ITEMS } from '~/features/navigation/admin-navigation';
import { useAdminAuthState } from '~/composables/useAdminAuthState';

const _permissions = ref<readonly string[]>([]);
const _isSuperAdmin = ref(false);

export function useAdminPermissions() {
  const { accessToken } = useAdminAuthState();

  function setPermissions(permissions: readonly string[], isSuperAdmin: boolean) {
    _permissions.value = permissions;
    _isSuperAdmin.value = isSuperAdmin;
  }

  function clearPermissions() {
    _permissions.value = [];
    _isSuperAdmin.value = false;
  }

  const hasPermission = (key: string): boolean => {
    if (!accessToken.value) return false;
    if (_isSuperAdmin.value) return true;
    // Logged-in users have implicitly verified admin.dashboard.view via the auth guard
    if (key === DragonPermissions.ADMIN_DASHBOARD_VIEW) return true;

    return _permissions.value.includes(key);
  };

  const visibleNavItems = computed(() =>
    filterNavByPermissions(
      ADMIN_NAV_ITEMS,
      new Set(
        _isSuperAdmin.value
          ? ADMIN_NAV_ITEMS.map((i) => i.permission)
          : [
              ...(accessToken.value ? [DragonPermissions.ADMIN_DASHBOARD_VIEW] : []),
              ..._permissions.value,
            ],
      ),
      _isSuperAdmin.value,
    ),
  );

  return {
    hasPermission,
    visibleNavItems,
    setPermissions,
    clearPermissions,
    isSuperAdmin: _isSuperAdmin,
  };
}
