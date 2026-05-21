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

definePageMeta({ layout: 'admin', middleware: ['admin-auth-required'] });
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
  color: #1e293b;
}

.create-btn {
  display: inline-block;
  padding: 0.45rem 1rem;
  background: #3b82f6;
  color: #fff;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.create-btn:hover {
  background: #2563eb;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
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
  color: #64748b;
  background: #f8fafc;
  border-block-end: 1px solid #e2e8f0;
  white-space: nowrap;
}
</style>
