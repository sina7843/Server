<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">نقش‌ها</h1>
      <NuxtLink
        v-if="hasPermission(Permissions.RBAC_ROLE_CREATE)"
        to="/roles/new"
        class="create-btn"
      >
        + ایجاد نقش
      </NuxtLink>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.RBAC_ROLE_READ)" />

    <LoadingState v-else-if="rolesLoading" />

    <ErrorState v-else-if="rolesError" :message="rolesError" @retry="loadRoles" />

    <EmptyState v-else-if="roles.length === 0" label="نقشی یافت نشد." />

    <template v-else>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="th">کلید</th>
              <th class="th">نام</th>
              <th class="th">نشانه</th>
              <th class="th" />
            </tr>
          </thead>
          <tbody>
            <RoleListItem
              v-for="role in roles"
              :key="role.id"
              :role="role"
              :can-edit="hasPermission(Permissions.RBAC_ROLE_UPDATE)"
              :can-deactivate="hasPermission(Permissions.RBAC_ROLE_DEACTIVATE)"
              @deactivate="onDeactivateRequest"
            />
          </tbody>
        </table>
      </div>
    </template>

    <ConfirmDialog
      :open="!!confirmDeactivateId"
      title="غیرفعال‌سازی نقش"
      description="آیا از غیرفعال‌سازی این نقش مطمئن هستید؟ کاربران دارای این نقش دسترسی‌های مربوطه را از دست می‌دهند."
      confirm-label="غیرفعال‌سازی"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onDeactivateConfirm"
      @cancel="confirmDeactivateId = null"
    />
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.RBAC_ROLE_READ,
});
useHead({ title: 'نقش‌ها — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { roles, rolesLoading, rolesError, actionLoading, loadRoles, deactivateRole } =
  useAdminRoles();

const confirmDeactivateId = ref<string | null>(null);

function onDeactivateRequest(id: string) {
  confirmDeactivateId.value = id;
}

async function onDeactivateConfirm() {
  if (!confirmDeactivateId.value) return;
  const ok = await deactivateRole(confirmDeactivateId.value);
  if (ok) confirmDeactivateId.value = null;
}

onMounted(loadRoles);
</script>

<style scoped>
.page {
  max-width: 1000px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 1.25rem;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.create-btn {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 1rem;
  background: var(--purple-500);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 0 0 0 rgba(109, 40, 217, 0);
  transition: all var(--motion-fast);
}

.create-btn:hover {
  background: var(--purple-400);
  box-shadow: 0 0 16px rgba(109, 40, 217, 0.35);
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
