<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink to="/users" class="back-link">← کاربران</NuxtLink>
      <h1 class="page-title">جزئیات کاربر</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.USER_READ)" />

    <LoadingState v-else-if="userLoading" />

    <ErrorState v-else-if="userError" :message="userError" @retry="reload" />

    <template v-else-if="user">
      <div class="card">
        <div class="card-row">
          <span class="label">نام نمایشی</span>
          <span class="value">{{ user.profile?.displayName ?? '—' }}</span>
        </div>
        <div class="card-row">
          <span class="label">نام کاربری</span>
          <span class="value">{{
            user.profile?.username ? `@${user.profile.username}` : '—'
          }}</span>
        </div>
        <div class="card-row">
          <span class="label">وضعیت</span>
          <UserStatusBadge :status="user.status" />
        </div>
        <div class="card-row">
          <span class="label">شماره</span>
          <span class="value ltr">{{ user.phoneMasked ?? '—' }}</span>
        </div>
        <div class="card-row">
          <span class="label">تأیید شماره</span>
          <span class="value">{{ user.phoneVerified ? 'بله' : 'خیر' }}</span>
        </div>
        <div v-if="user.lastLoginAt" class="card-row">
          <span class="label">آخرین ورود</span>
          <span class="value">{{ formatDate(user.lastLoginAt) }}</span>
        </div>
        <div class="card-row">
          <span class="label">تاریخ ثبت</span>
          <span class="value">{{ formatDate(user.createdAt) }}</span>
        </div>
      </div>

      <div v-if="hasPermission(Permissions.USER_STATUS_UPDATE)" class="actions">
        <NuxtLink :to="`/users/${user.id}/edit`" class="edit-btn">تغییر وضعیت</NuxtLink>
      </div>

      <section class="sessions-section">
        <h2 class="section-title">نشست‌های فعال</h2>

        <LoadingState v-if="sessionsLoading" label="بارگذاری نشست‌ها…" />

        <ErrorState v-else-if="sessionsError" :message="sessionsError" @retry="reloadSessions" />

        <EmptyState v-else-if="sessions.length === 0" label="نشستی یافت نشد." />

        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">دستگاه</th>
                <th class="th">وضعیت</th>
                <th class="th">تاریخ ایجاد</th>
                <th class="th">انقضا</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <SessionListItem
                v-for="session in sessions"
                :key="session.id"
                :session="session"
                :can-revoke="hasPermission(Permissions.USER_SESSION_REVOKE)"
                :revoking="revokingId === session.id"
                @revoke="onRevokeRequest(session.id)"
              />
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        :open="!!confirmSessionId"
        title="ابطال نشست"
        description="آیا از ابطال این نشست مطمئن هستید؟ کاربر از دستگاه مربوطه خارج می‌شود."
        confirm-label="ابطال"
        :destructive="true"
        :loading="actionLoading"
        @confirm="onRevokeConfirm"
        @cancel="confirmSessionId = null"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({ layout: 'admin', middleware: ['admin-auth-required'] });

const route = useRoute();
const userId = route.params.id as string;

const { hasPermission } = useAdminPermissions();
const {
  user,
  userLoading,
  userError,
  sessions,
  sessionsLoading,
  sessionsError,
  actionLoading,
  loadUser,
  loadSessions,
  revokeSession,
} = useAdminUsers();

useHead(() => ({
  title: user.value?.profile?.displayName
    ? `${user.value.profile.displayName} — Dragon Admin`
    : 'کاربر — Dragon Admin',
}));

async function reload() {
  await loadUser(userId);
}

async function reloadSessions() {
  await loadSessions(userId);
}

const revokingId = ref<string | null>(null);
const confirmSessionId = ref<string | null>(null);

function onRevokeRequest(sessionId: string) {
  confirmSessionId.value = sessionId;
}

async function onRevokeConfirm() {
  if (!confirmSessionId.value) return;
  revokingId.value = confirmSessionId.value;
  const ok = await revokeSession(userId, confirmSessionId.value);
  revokingId.value = null;
  if (ok) confirmSessionId.value = null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(async () => {
  await reload();
  await reloadSessions();
});
</script>

<style scoped>
.page {
  max-width: 780px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.back-link {
  font-size: 0.85rem;
  color: #3b82f6;
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
  color: #1e293b;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-block-end: 1rem;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-block-end: 1px solid #f1f5f9;
}

.card-row:last-child {
  border-block-end: none;
}

.label {
  min-width: 120px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
}

.value {
  font-size: 0.9rem;
  color: #1e293b;
}

.ltr {
  direction: ltr;
}

.actions {
  margin-block-end: 1.5rem;
}

.edit-btn {
  display: inline-block;
  padding: 0.5rem 1.1rem;
  background: #3b82f6;
  color: #fff;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s;
}

.edit-btn:hover {
  background: #2563eb;
}

.sessions-section {
  margin-block-start: 1.5rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
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
  padding: 0.65rem 1rem;
  text-align: start;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
  border-block-end: 1px solid #e2e8f0;
  white-space: nowrap;
}
</style>
