<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">مجوزها</h1>
      <p class="page-subtitle">فهرست مجوزهای سیستم — فقط خواندنی</p>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.RBAC_PERMISSION_READ)" />

    <template v-else>
      <div class="filters">
        <input
          v-model="moduleFilter"
          class="filter-input"
          type="search"
          placeholder="فیلتر بر اساس ماژول…"
          @input="onFilterChange"
        />
        <input
          v-model="resourceFilter"
          class="filter-input"
          type="search"
          placeholder="فیلتر بر اساس منبع…"
          @input="onFilterChange"
        />
      </div>

      <LoadingState v-if="allPermissionsLoading" />

      <ErrorState v-else-if="allPermissionsError" :message="allPermissionsError" @retry="reload" />

      <EmptyState v-else-if="allPermissions.length === 0" label="مجوزی یافت نشد." />

      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="th">کلید</th>
              <th class="th">ماژول</th>
              <th class="th">منبع</th>
              <th class="th">عملیات</th>
              <th class="th">توضیحات</th>
            </tr>
          </thead>
          <tbody>
            <PermissionListItem v-for="p in allPermissions" :key="p.id" :permission="p" />
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.RBAC_PERMISSION_READ,
});
useHead({ title: 'مجوزها — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { allPermissions, allPermissionsLoading, allPermissionsError, loadAllPermissions } =
  useAdminRoles();

const moduleFilter = ref('');
const resourceFilter = ref('');
let filterTimer: ReturnType<typeof setTimeout> | null = null;

async function reload() {
  await loadAllPermissions({
    ...(moduleFilter.value.trim() ? { module: moduleFilter.value.trim() } : {}),
    ...(resourceFilter.value.trim() ? { resource: resourceFilter.value.trim() } : {}),
  });
}

function onFilterChange() {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(reload, 350);
}

onMounted(reload);
</script>

<style scoped>
.page {
  max-width: 1000px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.page-title {
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.filters {
  display: flex;
  gap: 0.75rem;
  margin-block-end: 1rem;
  flex-wrap: wrap;
}

.filter-input {
  flex: 1;
  min-width: 160px;
  height: 34px;
  padding: 0 0.85rem;
  background: var(--input-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--motion-fast);
}

.filter-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15);
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.th {
  padding: 0.7rem 1rem;
  text-align: start;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--hover-overlay);
  border-block-end: 1px solid var(--border-default);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
