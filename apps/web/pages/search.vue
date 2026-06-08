<template>
  <main class="search-page">
    <h1 class="search-page__title">جستجو</h1>

    <SearchForm
      v-model:query="q"
      v-model:type="selectedType"
      @query-change="onQueryChange"
      @type-change="onTypeChange"
    />

    <SearchStateMessage v-if="loading" state="loading" />
    <SearchStateMessage v-else-if="error" state="error" />
    <SearchStateMessage v-else-if="items.length === 0 && q.trim()" state="no-results" :query="q" />
    <SearchStateMessage v-else-if="items.length === 0" state="empty" />
    <template v-else>
      <SearchResults :items="items" :total="total" />
      <SearchPagination :page="currentPage" :total="total" :limit="limit" @page-change="goToPage" />
    </template>
  </main>
</template>

<script setup lang="ts">
import type { PublicContentSearchType } from '@dragon/types';

useHead({ title: 'جستجو — دراگون' });

const route = useRoute();
const router = useRouter();
const { loading, error, items, total, limit, search, debounceSearch } = usePublicSearch();

const q = ref(typeof route.query['q'] === 'string' ? route.query['q'] : '');
const selectedType = ref(typeof route.query['type'] === 'string' ? route.query['type'] : '');
const currentPage = ref(
  typeof route.query['page'] === 'string' && !isNaN(parseInt(route.query['page'], 10))
    ? Math.max(1, parseInt(route.query['page'], 10))
    : 1,
);

function buildParams() {
  return {
    ...(q.value ? { q: q.value } : {}),
    ...(selectedType.value ? { type: selectedType.value as PublicContentSearchType } : {}),
    page: currentPage.value,
    limit: limit.value,
  };
}

function updateUrl() {
  const query: Record<string, string> = {};
  if (q.value) query['q'] = q.value;
  if (selectedType.value) query['type'] = selectedType.value;
  if (currentPage.value > 1) query['page'] = String(currentPage.value);
  void router.replace({ query });
}

function onQueryChange() {
  currentPage.value = 1;
  updateUrl();
  debounceSearch(buildParams());
}

function onTypeChange() {
  currentPage.value = 1;
  updateUrl();
  void search(buildParams());
}

function goToPage(p: number) {
  currentPage.value = p;
  updateUrl();
  void search(buildParams());
}

onMounted(() => {
  void search(buildParams());
});
</script>

<style scoped>
.search-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.search-page__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0 0 var(--space-6);
  color: var(--text-primary);
}
</style>
