<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/roles" class="back-link">← نقش‌ها</NuxtLink>
      <h1 class="page-title">جزئیات نقش</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.RBAC_ROLE_READ)" />

    <LoadingState v-else-if="roleLoading" />

    <ErrorState v-else-if="roleError" :message="roleError" @retry="reload" />

    <template v-else-if="role">
      <div class="card">
        <div class="card-row">
          <span class="label">کلید</span>
          <code class="value value-mono">{{ role.key }}</code>
        </div>
        <div class="card-row">
          <span class="label">نام</span>
          <span class="value">{{ role.name }}</span>
        </div>
        <div v-if="role.description" class="card-row">
          <span class="label">توضیحات</span>
          <span class="value">{{ role.description }}</span>
        </div>
        <div class="card-row">
          <span class="label">وضعیت</span>
          <span class="value">
            <span v-if="role.isActive" class="badge-active">فعال</span>
            <span v-else class="badge-inactive">غیرفعال</span>
          </span>
        </div>
        <div class="card-row">
          <span class="label">نوع</span>
          <span class="value">
            <SystemRoleBadge v-if="role.isSystem" />
            <span v-else class="badge-custom">سفارشی</span>
          </span>
        </div>
        <div class="card-row">
          <span class="label">قابل تخصیص</span>
          <span class="value">{{ role.isAssignable ? 'بله' : 'خیر' }}</span>
        </div>
      </div>

      <div v-if="role.isSystem" class="system-notice">
        <strong>محدودیت سیستمی:</strong> این نقش سیستمی است. ویرایش، غیرفعال‌سازی، و تغییر مجوزها
        توسط UI مجاز نیست.
      </div>

      <div v-if="!role.isSystem" class="actions">
        <NuxtLink
          v-if="hasPermission(Permissions.RBAC_ROLE_UPDATE)"
          :to="`/roles/${role.id}/edit`"
          class="edit-btn"
        >
          ویرایش نقش
        </NuxtLink>
        <button
          v-if="hasPermission(Permissions.RBAC_ROLE_DEACTIVATE) && role.isActive"
          class="deactivate-btn"
          type="button"
          @click="showDeactivateConfirm = true"
        >
          غیرفعال‌سازی
        </button>
      </div>

      <section class="permissions-section">
        <div class="section-header">
          <h2 class="section-title">مجوزهای متصل</h2>
          <button
            v-if="canAttach && !role.isSystem"
            class="attach-btn"
            type="button"
            @click="showAttachPanel = !showAttachPanel"
          >
            + افزودن مجوز
          </button>
        </div>

        <div v-if="showAttachPanel && !role.isSystem" class="attach-panel">
          <select v-model="selectedPermissionId" class="perm-select">
            <option value="">— انتخاب مجوز —</option>
            <option v-for="p in availablePermissions" :key="p.id" :value="p.id">
              {{ p.key }}
            </option>
          </select>
          <button
            class="confirm-attach-btn"
            type="button"
            :disabled="!selectedPermissionId || actionLoading"
            @click="onAttach"
          >
            افزودن
          </button>
        </div>

        <LoadingState v-if="rolePermissionsLoading" label="بارگذاری مجوزها…" />

        <ErrorState
          v-else-if="rolePermissionsError"
          :message="rolePermissionsError"
          @retry="reloadPermissions"
        />

        <EmptyState v-else-if="rolePermissions.length === 0" label="مجوزی متصل نشده." />

        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">کلید</th>
                <th class="th">ماژول</th>
                <th class="th">منبع</th>
                <th class="th">عملیات</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <RolePermissionItem
                v-for="p in rolePermissions"
                :key="p.id"
                :permission="p"
                :can-detach="canDetach && !role.isSystem"
                :detaching="detachingId === p.id"
                @detach="onDetachRequest"
              />
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <ConfirmDialog
      :open="showDeactivateConfirm"
      title="غیرفعال‌سازی نقش"
      description="آیا از غیرفعال‌سازی این نقش مطمئن هستید؟ این عملیات قابل بازگشت است."
      confirm-label="غیرفعال‌سازی"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onDeactivateConfirm"
      @cancel="showDeactivateConfirm = false"
    />

    <ConfirmDialog
      :open="!!confirmDetachId"
      title="حذف مجوز از نقش"
      description="آیا از حذف این مجوز از نقش مطمئن هستید؟"
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onDetachConfirm"
      @cancel="confirmDetachId = null"
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

const route = useRoute();
const router = useRouter();
const roleId = route.params.id as string;

const { hasPermission } = useAdminPermissions();
const {
  role,
  roleLoading,
  roleError,
  rolePermissions,
  rolePermissionsLoading,
  rolePermissionsError,
  allPermissions,
  actionLoading,
  loadRole,
  loadRolePermissions,
  loadAllPermissions,
  deactivateRole,
  attachPermission,
  detachPermission,
} = useAdminRoles();

useHead(() => ({
  title: role.value?.name ? `${role.value.name} — Dragon Admin` : 'نقش — Dragon Admin',
}));

const canAttach = computed(() => hasPermission(Permissions.RBAC_PERMISSION_ATTACH));
const canDetach = computed(() => hasPermission(Permissions.RBAC_PERMISSION_DETACH));

const showDeactivateConfirm = ref(false);
const showAttachPanel = ref(false);
const selectedPermissionId = ref('');
const confirmDetachId = ref<string | null>(null);
const detachingId = ref<string | null>(null);

const attachedPermissionIds = computed(() => new Set(rolePermissions.value.map((p) => p.id)));

const availablePermissions = computed(() =>
  allPermissions.value.filter((p) => !attachedPermissionIds.value.has(p.id)),
);

async function reload() {
  await loadRole(roleId);
}

async function reloadPermissions() {
  await loadRolePermissions(roleId);
}

async function onDeactivateConfirm() {
  const ok = await deactivateRole(roleId);
  if (ok) {
    showDeactivateConfirm.value = false;
    await router.push('/roles');
  }
}

async function onAttach() {
  if (!selectedPermissionId.value) return;
  const ok = await attachPermission(roleId, selectedPermissionId.value);
  if (ok) {
    selectedPermissionId.value = '';
    showAttachPanel.value = false;
  }
}

function onDetachRequest(id: string) {
  confirmDetachId.value = id;
}

async function onDetachConfirm() {
  if (!confirmDetachId.value) return;
  detachingId.value = confirmDetachId.value;
  const ok = await detachPermission(roleId, confirmDetachId.value);
  detachingId.value = null;
  if (ok) confirmDetachId.value = null;
}

onMounted(async () => {
  await reload();
  await reloadPermissions();
  if (canAttach.value) {
    await loadAllPermissions();
  }
});
</script>

<style scoped>
.page {
  max-width: 860px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.back-link {
  font-size: 0.85rem;
  color: var(--purple-400);
  text-decoration: none;
  display: inline-block;
  margin-block-end: 0.4rem;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
}

.card {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-block-end: 1rem;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-block-end: 1px solid var(--border-subtle);
}

.card-row:last-child {
  border-block-end: none;
}

.label {
  min-width: 100px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.value {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.value-mono {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  background: var(--hover-overlay);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-xs);
}

.badge-active {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-400);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.badge-inactive {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--hover-overlay);
  color: var(--text-muted);
  border: 1px solid var(--border-default);
}

.badge-custom {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-400);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.system-notice {
  background: rgba(109, 40, 217, 0.08);
  border: 1px solid rgba(109, 40, 217, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--purple-300);
  margin-block-end: 1rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-block-end: 1.5rem;
}

.edit-btn {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 1.1rem;
  background: var(--purple-500);
  color: #fff;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 0 0 0 rgba(109, 40, 217, 0);
  transition: all var(--motion-fast);
}

.edit-btn:hover {
  background: var(--purple-400);
  box-shadow: 0 0 16px rgba(109, 40, 217, 0.35);
}

.deactivate-btn {
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 1.1rem;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger-400);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--motion-fast);
}

.deactivate-btn:hover {
  background: rgba(239, 68, 68, 0.18);
}

.permissions-section {
  margin-block-start: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 0.75rem;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-primary);
}

.attach-btn {
  font-size: 0.82rem;
  color: var(--purple-400);
  background: none;
  border: 1px solid rgba(109, 40, 217, 0.3);
  border-radius: var(--radius-xs);
  padding: 0.25rem 0.65rem;
  cursor: pointer;
  transition: background var(--motion-fast);
}

.attach-btn:hover {
  background: rgba(109, 40, 217, 0.08);
}

.attach-panel {
  display: flex;
  gap: 0.5rem;
  margin-block-end: 0.75rem;
}

.perm-select {
  flex: 1;
  padding: 0.45rem 0.75rem;
  background: var(--input-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-primary);
  outline: none;
}

.confirm-attach-btn {
  height: 36px;
  padding: 0 0.9rem;
  background: var(--purple-500);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--motion-fast);
}

.confirm-attach-btn:not(:disabled):hover {
  background: var(--purple-400);
}

.confirm-attach-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  padding: 0.65rem 1rem;
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
