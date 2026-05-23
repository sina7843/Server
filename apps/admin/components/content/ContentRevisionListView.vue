<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink :to="backPath" class="back-link">← بازگشت</NuxtLink>
      <h1 class="page-title">تاریخچه نسخه‌ها</h1>
    </div>

    <ForbiddenState v-if="!hasPermission(readPermission)" />

    <template v-else>
      <LoadingState v-if="revisionsLoading" />

      <ErrorState v-else-if="revisionsError" :message="revisionsError" @retry="load" />

      <EmptyState v-else-if="revisions.length === 0" label="هیچ نسخه‌ای یافت نشد." />

      <template v-else>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th class="th">نسخه</th>
                <th class="th">تاریخ</th>
                <th class="th">عنوان در این نسخه</th>
                <th class="th">وضعیت</th>
                <th class="th" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="rev in revisions"
                :key="rev.id"
                class="tr"
                :class="{ 'tr--selected': selectedRevisionId === rev.id }"
              >
                <td class="td td--rev">#{{ rev.revisionNumber }}</td>
                <td class="td td--date">{{ formatDate(rev.createdAt) }}</td>
                <td class="td td--title">
                  {{ snapshotTitle(rev) }}
                </td>
                <td class="td">
                  <ContentStatusBadge :status="snapshotStatus(rev)" />
                </td>
                <td class="td td--actions">
                  <button
                    class="action-btn"
                    type="button"
                    :class="{ 'action-btn--active': selectedRevisionId === rev.id }"
                    @click="toggleRevision(rev.id)"
                  >
                    {{ selectedRevisionId === rev.id ? 'بستن' : 'مشاهده' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-if="selectedRevisionId">
          <LoadingState v-if="revisionLoading" />
          <ErrorState v-else-if="revisionError" :message="revisionError" />
          <div v-else-if="revision" class="revision-detail">
            <div class="detail-header">
              <h2 class="detail-title">نسخه #{{ revision.revisionNumber }}</h2>
              <span class="detail-date">{{ formatDate(revision.createdAt) }}</span>
              <div class="restore-notice">بازیابی نسخه‌ها در این مرحله پشتیبانی نمی‌شود.</div>
            </div>
            <pre class="snapshot-view">{{ JSON.stringify(revision.snapshot, null, 2) }}</pre>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

const props = defineProps<{
  resourceId: string;
  resourceType: 'post' | 'page';
  backPath: string;
}>();

const readPermission = computed(() =>
  props.resourceType === 'post' ? Permissions.CONTENT_POST_READ : Permissions.CONTENT_PAGE_READ,
);

const { hasPermission } = useAdminPermissions();
const {
  revisions,
  revisionsLoading,
  revisionsError,
  revision,
  revisionLoading,
  revisionError,
  loadPostRevisions,
  loadPageRevisions,
  loadPostRevisionDetail,
  loadPageRevisionDetail,
} = useAdminContent();

const selectedRevisionId = ref<string | null>(null);

async function load() {
  if (props.resourceType === 'post') {
    await loadPostRevisions(props.resourceId);
  } else {
    await loadPageRevisions(props.resourceId);
  }
}

async function toggleRevision(id: string) {
  if (selectedRevisionId.value === id) {
    selectedRevisionId.value = null;
    return;
  }

  selectedRevisionId.value = id;

  if (props.resourceType === 'post') {
    await loadPostRevisionDetail(props.resourceId, id);
  } else {
    await loadPageRevisionDetail(props.resourceId, id);
  }
}

function snapshotTitle(rev: unknown): string {
  const s = ((rev as { snapshot?: unknown }).snapshot ?? {}) as Record<string, unknown>;
  return String(s?.title ?? '—');
}

function snapshotStatus(rev: unknown): string {
  const s = ((rev as { snapshot?: unknown }).snapshot ?? {}) as Record<string, unknown>;
  return String(s?.status ?? '—');
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

onMounted(load);
</script>

<style scoped>
.page {
  max-width: 1000px;
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
.tr--selected {
  background: #eff6ff;
}
.td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
}
.td--rev {
  font-weight: 700;
  font-family: monospace;
}
.td--date {
  white-space: nowrap;
  color: #64748b;
}
.td--title {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.td--actions {
  white-space: nowrap;
}

.action-btn {
  font-size: 0.82rem;
  padding: 0.2rem 0.6rem;
  border: none;
  border-radius: 0.3rem;
  cursor: pointer;
  background: #e0f2fe;
  color: #0369a1;
  transition: opacity 0.15s;
}
.action-btn:hover {
  opacity: 0.8;
}
.action-btn--active {
  background: #3b82f6;
  color: #fff;
}

.revision-detail {
  margin-block-start: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-block-end: 1px solid #e2e8f0;
  flex-wrap: wrap;
}
.detail-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}
.detail-date {
  font-size: 0.82rem;
  color: #64748b;
}

.restore-notice {
  margin-inline-start: auto;
  font-size: 0.78rem;
  color: #475569;
  background: #f1f5f9;
  padding: 0.2rem 0.6rem;
  border-radius: 0.3rem;
}

.snapshot-view {
  padding: 1rem;
  font-size: 0.8rem;
  font-family: monospace;
  overflow-x: auto;
  background: #fff;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #334155;
  max-height: 400px;
  overflow-y: auto;
}
</style>
