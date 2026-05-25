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
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.filters {
  display: flex;
  gap: 0.75rem;
  margin-block-end: 1rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 180px;
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
}

.search-input:focus {
  border-color: #3b82f6;
}

.status-select {
  padding: 0.5rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  background: #fff;
  outline: none;
  cursor: pointer;
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

.tr:not(:last-child) {
  border-block-end: 1px solid #f1f5f9;
}

.td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
}

.td--date {
  color: #64748b;
  white-space: nowrap;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-block-start: 1rem;
  justify-content: flex-end;
}

.page-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  background: #fff;
  cursor: pointer;
  color: #334155;
  transition: background 0.15s;
}

.page-btn:not(:disabled):hover {
  background: #f1f5f9;
}

.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: #64748b;
}
</style>
