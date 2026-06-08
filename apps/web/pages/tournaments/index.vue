<template>
  <main class="tournaments-page">
    <div class="tournaments-page__header">
      <span class="dr-label">Tournaments</span>
      <h1 class="tournaments-page__title">تورنمنت‌ها</h1>
      <p class="tournaments-page__description">
        همه رقابت‌های فعال، آینده و گذشته را در یک مکان بیابید.
      </p>
    </div>

    <div class="tournaments-page__filters">
      <input
        v-model="q"
        class="tournaments-page__search"
        type="search"
        placeholder="جستجو در تورنمنت‌ها..."
        aria-label="جستجو در تورنمنت‌ها"
        @input="onQueryInput"
      />

      <select
        v-model="selectedStatus"
        class="tournaments-page__select"
        aria-label="فیلتر وضعیت"
        @change="onFilterChange"
      >
        <option value="">همه وضعیت‌ها</option>
        <option value="registration_open">ثبت‌نام باز</option>
        <option value="registration_closed">ثبت‌نام بسته</option>
        <option value="in_progress">در حال برگزاری</option>
        <option value="published">منتشر شده</option>
        <option value="completed">پایان یافته</option>
        <option value="cancelled">لغو شده</option>
      </select>

      <select
        v-model="selectedFormat"
        class="tournaments-page__select"
        aria-label="فیلتر فرمت"
        @change="onFilterChange"
      >
        <option value="">همه فرمت‌ها</option>
        <option value="single_elimination">حذفی</option>
        <option value="round_robin">لیگ</option>
        <option value="manual">دستی</option>
      </select>

      <select
        v-if="games.length > 0"
        v-model="selectedGameId"
        class="tournaments-page__select"
        aria-label="فیلتر بازی"
        @change="onFilterChange"
      >
        <option value="">همه بازی‌ها</option>
        <option v-for="game in games" :key="game.id" :value="game.id">{{ game.name }}</option>
      </select>

      <label class="tournaments-page__checkbox-label">
        <input
          v-model="registrationOpen"
          type="checkbox"
          class="tournaments-page__checkbox"
          @change="onFilterChange"
        />
        فقط ثبت‌نام باز
      </label>
    </div>

    <div v-if="loading" class="tournaments-page__state">
      <span class="tournaments-page__state-text">در حال بارگذاری...</span>
    </div>

    <div v-else-if="error" class="tournaments-page__state tournaments-page__state--error">
      <span class="tournaments-page__state-text">{{ error }}</span>
      <button class="dr-btn dr-btn-secondary" @click="loadTournaments">تلاش مجدد</button>
    </div>

    <div
      v-else-if="
        items.length === 0 && (q.trim() || selectedStatus || selectedFormat || selectedGameId)
      "
      class="tournaments-page__state"
    >
      <span class="tournaments-page__state-text">نتیجه‌ای یافت نشد.</span>
      <button class="dr-btn dr-btn-secondary" @click="clearFilters">پاک کردن فیلترها</button>
    </div>

    <div v-else-if="items.length === 0" class="tournaments-page__state">
      <span class="tournaments-page__state-text">هیچ تورنمنتی موجود نیست.</span>
    </div>

    <template v-else>
      <ul class="tournaments-page__grid" role="list">
        <li v-for="tournament in items" :key="tournament.id">
          <TournamentCard :tournament="tournament" />
        </li>
      </ul>

      <nav v-if="totalPages > 1" class="tournaments-page__pagination" aria-label="صفحه‌بندی">
        <button
          class="dr-btn dr-btn-secondary"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          قبلی
        </button>
        <span class="tournaments-page__page-info">
          صفحه {{ currentPage }} از {{ totalPages }}
        </span>
        <button
          class="dr-btn dr-btn-secondary"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          بعدی
        </button>
      </nav>
    </template>
  </main>
</template>

<script setup lang="ts">
import type { TournamentStatus, TournamentFormat, PublicGameDto } from '@dragon/types';
import {
  createGamesDiscoveryApi,
  createTournamentsDiscoveryApi,
  createTournamentSearchApi,
} from '~/features/tournaments/tournaments-api';

const PAGE_LIMIT = 20;
const DEBOUNCE_MS = 350;

const runtimeConfig = useRuntimeConfig();
const route = useRoute();
const router = useRouter();

const q = ref(typeof route.query['q'] === 'string' ? route.query['q'] : '');
const selectedStatus = ref(typeof route.query['status'] === 'string' ? route.query['status'] : '');
const selectedFormat = ref(typeof route.query['format'] === 'string' ? route.query['format'] : '');
const selectedGameId = ref(typeof route.query['gameId'] === 'string' ? route.query['gameId'] : '');
const registrationOpen = ref(route.query['registrationOpen'] === 'true');
const currentPage = ref(
  typeof route.query['page'] === 'string' && !isNaN(parseInt(route.query['page'], 10))
    ? Math.max(1, parseInt(route.query['page'], 10))
    : 1,
);

const games = ref<readonly PublicGameDto[]>([]);

const baseUrl = runtimeConfig.public?.apiBaseUrl as string | undefined;

function buildFilter() {
  return {
    ...(q.value.trim() ? { q: q.value.trim() } : {}),
    ...(selectedStatus.value ? { status: selectedStatus.value as TournamentStatus } : {}),
    ...(selectedFormat.value ? { format: selectedFormat.value as TournamentFormat } : {}),
    ...(selectedGameId.value ? { gameId: selectedGameId.value } : {}),
    ...(registrationOpen.value ? { registrationOpen: true } : {}),
    page: currentPage.value,
    limit: PAGE_LIMIT,
  };
}

// useAsyncData manages data in Nuxt's payload system — survives SSR → client hydration.
// Template reads from `data` directly via computed properties; no local ref sync needed.
const {
  data,
  pending: loading,
  error: fetchError,
  refresh,
} = await useAsyncData('public-tournaments-index', () => {
  const filter = buildFilter();
  if (filter.q) {
    return createTournamentSearchApi({ baseUrl }).tournaments(filter);
  }
  return createTournamentsDiscoveryApi({ baseUrl }).list(filter);
});

const items = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.total ?? 0);
const error = computed(() => fetchError.value?.message ?? null);
const totalPages = computed(() => (total.value > 0 ? Math.ceil(total.value / PAGE_LIMIT) : 1));

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function updateUrl() {
  const query: Record<string, string> = {};
  if (q.value.trim()) query['q'] = q.value.trim();
  if (selectedStatus.value) query['status'] = selectedStatus.value;
  if (selectedFormat.value) query['format'] = selectedFormat.value;
  if (selectedGameId.value) query['gameId'] = selectedGameId.value;
  if (registrationOpen.value) query['registrationOpen'] = 'true';
  if (currentPage.value > 1) query['page'] = String(currentPage.value);
  void router.replace({ query });
}

function loadTournaments() {
  void refresh();
}

function onQueryInput() {
  currentPage.value = 1;
  updateUrl();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void refresh(), DEBOUNCE_MS);
}

function onFilterChange() {
  currentPage.value = 1;
  updateUrl();
  void refresh();
}

function goToPage(p: number) {
  currentPage.value = p;
  updateUrl();
  void refresh();
}

function clearFilters() {
  q.value = '';
  selectedStatus.value = '';
  selectedFormat.value = '';
  selectedGameId.value = '';
  registrationOpen.value = false;
  currentPage.value = 1;
  updateUrl();
  void refresh();
}

const siteName = (runtimeConfig.public?.siteName as string | undefined) ?? 'Dragon';
const PAGE_TITLE = `تورنمنت‌ها — ${siteName}`;
const PAGE_DESCRIPTION = 'فهرست کامل تورنمنت‌های اسپورت. ثبت‌نام کنید و در رقابت‌ها شرکت کنید.';

useHead({
  title: PAGE_TITLE,
  meta: [
    { name: 'description', content: PAGE_DESCRIPTION },
    { property: 'og:title', content: PAGE_TITLE },
    { property: 'og:description', content: PAGE_DESCRIPTION },
    { property: 'og:type', content: 'website' },
  ],
});

onMounted(async () => {
  try {
    const gamesApi = createGamesDiscoveryApi({
      baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
    });
    const res = await gamesApi.list({ limit: 100 });
    games.value = res.items;
  } catch {
    // games filter is optional
  }
});
</script>

<style scoped>
.tournaments-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.tournaments-page__header {
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tournaments-page__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  margin: 0;
  color: var(--text-primary);
}

.tournaments-page__description {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.tournaments-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
  align-items: center;
}

.tournaments-page__search {
  flex: 1 1 200px;
  min-width: 180px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--text-body-size);
  background: var(--surface-input);
  color: var(--text-primary);
}

.tournaments-page__select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--text-body-size);
  background: var(--surface-input);
  color: var(--text-primary);
}

.tournaments-page__checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-body-size);
  color: var(--text-primary);
  cursor: pointer;
}

.tournaments-page__checkbox {
  cursor: pointer;
}

.tournaments-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.tournaments-page__state--error .tournaments-page__state-text {
  color: var(--color-danger);
}

.tournaments-page__state-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
}

.tournaments-page__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .tournaments-page__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .tournaments-page__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.tournaments-page__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-10);
}

.tournaments-page__page-info {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
}
</style>
