<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">پیام‌های تماس</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(Permissions.SITE_MESSAGE_READ)" />

    <template v-else>
      <LoadingState v-if="loading" />

      <ErrorState v-else-if="error" :message="error" @retry="loadMessages" />

      <EmptyState v-else-if="messages.length === 0" label="پیامی وجود ندارد" />

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">نام</th>
                <th class="th">ایمیل</th>
                <th class="th">موضوع</th>
                <th class="th">پیام</th>
                <th class="th">تاریخ</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="msg in messages" :key="msg.id" class="tr">
                <td class="td td--name">{{ msg.name }}</td>
                <td class="td td--email">{{ msg.email }}</td>
                <td class="td td--subject">{{ msg.subject ?? '—' }}</td>
                <td class="td td--message">{{ truncate(msg.message) }}</td>
                <td class="td td--date">{{ formatDate(msg.createdAt) }}</td>
                <td class="td td--actions">
                  <button
                    v-if="hasPermission(Permissions.SITE_MESSAGE_MANAGE)"
                    class="action-btn action-btn--delete"
                    type="button"
                    @click="openDelete(msg.id)"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button
            class="page-btn"
            type="button"
            :disabled="page <= 1"
            @click="goToPage(page - 1)"
          >
            قبلی
          </button>
          <span class="page-info">صفحه {{ page }}</span>
          <button
            class="page-btn"
            type="button"
            :disabled="page * limit >= total"
            @click="goToPage(page + 1)"
          >
            بعدی
          </button>
        </div>
      </template>
    </template>

    <ConfirmDialog
      :open="deleteDialogOpen"
      title="حذف پیام"
      description="آیا مطمئن هستید که می‌خواهید این پیام را حذف کنید؟ این عملیات قابل بازگشت نیست."
      confirm-label="حذف"
      :destructive="true"
      :loading="actionLoading"
      @confirm="onConfirmDelete"
      @cancel="deleteDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';
import type { ContactMessageDto } from '@dragon/sdk';
import {
  listContactMessages,
  deleteContactMessage,
} from '~/features/site/admin-site.api';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.SITE_MESSAGE_READ,
});

useHead({ title: 'پیام‌های تماس — Dragon Admin' });

const { hasPermission } = useAdminPermissions();
const client = useAdminApiClient();

const PAGE_LIMIT = 20;

const page = ref(1);
const limit = ref(PAGE_LIMIT);
const total = ref(0);
const messages = ref<ContactMessageDto[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const actionLoading = ref(false);
const deleteDialogOpen = ref(false);
const pendingId = ref<string | null>(null);

async function loadMessages() {
  loading.value = true;
  error.value = null;
  try {
    const res = await listContactMessages(client, { page: page.value, limit: limit.value });
    messages.value = [...res.items];
    total.value = res.total;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'خطا در بارگذاری پیام‌ها';
  } finally {
    loading.value = false;
  }
}

async function goToPage(newPage: number) {
  page.value = newPage;
  await loadMessages();
}

function openDelete(id: string) {
  pendingId.value = id;
  deleteDialogOpen.value = true;
}

async function onConfirmDelete() {
  if (!pendingId.value) return;
  actionLoading.value = true;
  try {
    await deleteContactMessage(client, pendingId.value);
    deleteDialogOpen.value = false;
    await loadMessages();
  } catch {
    // keep dialog open on failure
  } finally {
    actionLoading.value = false;
  }
}

function truncate(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
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

onMounted(loadMessages);
</script>

<style scoped>
.page {
  max-width: 1100px;
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

.td--name {
  font-weight: 500;
  white-space: nowrap;
}

.td--email {
  color: #64748b;
  font-size: 0.82rem;
  white-space: nowrap;
}

.td--subject {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td--message {
  color: #475569;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td--date {
  color: #64748b;
  white-space: nowrap;
}

.td--actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.action-btn {
  font-size: 0.82rem;
  padding: 0.2rem 0.55rem;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: opacity 0.15s;
}

.action-btn--delete {
  background: #fee2e2;
  color: #991b1b;
}

.action-btn:hover {
  opacity: 0.8;
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
