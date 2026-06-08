<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">کاربران</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.USER_READ)" />

    <template v-else>
      <div class="filters">
        <input
          v-model="searchQuery"
          class="search-input"
          type="search"
          placeholder="جستجو بر اساس نام کاربری…"
          @input="onSearchInput"
        />
        <select
          v-if="!searchMode"
          v-model="statusFilter"
          class="status-select"
          @change="onFilterChange"
        >
          <option value="">همه وضعیت‌ها</option>
          <option v-for="s in ADMIN_USER_STATUSES" :key="s" :value="s">
            {{ STATUS_LABELS[s] }}
          </option>
        </select>
      </div>

      <!-- Search mode: results from admin search API -->
      <template v-if="searchMode">
        <LoadingState v-if="userLoading" />
        <ErrorState v-else-if="userError" :message="userError" @retry="runSearch" />
        <EmptyState v-else-if="userItems.length === 0" label="نتیجه‌ای یافت نشد." />
        <template v-else>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th class="th">نام</th>
                  <th class="th">وضعیت</th>
                  <th class="th">تاریخ ثبت</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in userItems" :key="item.id" class="tr">
                  <td class="td">{{ item.title }}</td>
                  <td class="td">{{ item.status ?? '—' }}</td>
                  <td class="td td--date">
                    {{ item.createdAt ? formatDate(item.createdAt) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <button
              class="page-btn"
              type="button"
              :disabled="searchPage <= 1"
              @click="goToSearchPage(searchPage - 1)"
            >
              قبلی
            </button>
            <span class="page-info">صفحه {{ searchPage }}</span>
            <button
              class="page-btn"
              type="button"
              :disabled="userItems.length < PAGE_LIMIT"
              @click="goToSearchPage(searchPage + 1)"
            >
              بعدی
            </button>
          </div>
        </template>
      </template>

      <!-- Browse mode: full user list with status filter -->
      <template v-else>
        <LoadingState v-if="usersLoading" />
        <ErrorState v-else-if="usersError" :message="usersError" @retry="reload" />
        <EmptyState v-else-if="users.length === 0" label="کاربری یافت نشد." />
        <template v-else>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th class="th">نام</th>
                  <th class="th">وضعیت</th>
                  <th class="th">شماره</th>
                  <th class="th">تاریخ ثبت</th>
                  <th class="th" />
                </tr>
              </thead>
              <tbody>
                <UserListItem v-for="user in users" :key="user.id" :user="user" />
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <button
              class="page-btn"
              type="button"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              قبلی
            </button>
            <span class="page-info">صفحه {{ currentPage }}</span>
            <button
              class="page-btn"
              type="button"
              :disabled="users.length < PAGE_LIMIT"
              @click="goToPage(currentPage + 1)"
            >
              بعدی
            </button>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions, ADMIN_USER_STATUSES } from '@dragon/sdk';
import type { AdminUserStatus } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.USER_READ,
});
useHead({ title: 'کاربران — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const { users, usersLoading, usersError, loadUsers } = useAdminUsers();
const { userItems, userLoading, userError, userPage: searchPage, searchUsers } = useAdminSearch();

const PAGE_LIMIT = 20;

const STATUS_LABELS: Record<AdminUserStatus, string> = {
  pending_verification: 'در انتظار تأیید',
  active: 'فعال',
  suspended: 'تعلیق',
  banned: 'مسدود',
  deleted: 'حذف‌شده',
};

const searchQuery = ref('');
const statusFilter = ref<AdminUserStatus | ''>('');
const currentPage = ref(1);
const searchMode = computed(() => searchQuery.value.trim().length > 0);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function buildListParams(page = currentPage.value) {
  return {
    ...(statusFilter.value ? { status: statusFilter.value as AdminUserStatus } : {}),
    page,
    limit: PAGE_LIMIT,
  };
}

async function reload(page = currentPage.value) {
  await loadUsers(buildListParams(page));
}

async function runSearch(page = searchPage.value) {
  await searchUsers({
    ...(searchQuery.value.trim() ? { q: searchQuery.value.trim() } : {}),
    page,
    limit: PAGE_LIMIT,
  });
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      await runSearch(1);
    } else {
      currentPage.value = 1;
      await reload(1);
    }
  }, 350);
}

async function onFilterChange() {
  currentPage.value = 1;
  await reload(1);
}

async function goToPage(page: number) {
  currentPage.value = page;
  await reload(page);
}

async function goToSearchPage(page: number) {
  await runSearch(page);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
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
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.filters {
  display: flex;
  gap: 8px;
  margin-block-end: 16px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 180px;
  height: 36px;
  padding: 0 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color var(--motion-fast);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
}

.status-select {
  height: 36px;
  padding: 0 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: border-color var(--motion-fast);
}

.status-select:focus {
  border-color: var(--purple-400);
  box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.18);
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
  padding: 10px 14px;
  text-align: start;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--hover-overlay);
  border-block-end: 1px solid var(--border-default);
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tr:not(:last-child) {
  border-block-end: 1px solid var(--border-subtle);
}

.td {
  padding: 11px 14px;
  font-size: 13.5px;
  color: var(--text-secondary);
  vertical-align: middle;
}

.td--date {
  color: var(--text-muted);
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 12px;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-block-start: 16px;
  justify-content: flex-end;
}

.page-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--input-bg);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all var(--motion-fast);
}

.page-btn:not(:disabled):hover {
  background: var(--hover-overlay-strong);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
</style>
