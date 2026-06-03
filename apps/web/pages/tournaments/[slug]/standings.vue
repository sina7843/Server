<template>
  <main class="standings-page">
    <div v-if="pending" class="standings-page__state" role="status">
      <span class="standings-page__state-text">در حال بارگذاری...</span>
    </div>

    <div
      v-else-if="fetchError"
      class="standings-page__state standings-page__state--error"
      role="alert"
    >
      <p class="standings-page__state-text">خطا در بارگذاری جدول رده‌بندی.</p>
    </div>

    <div
      v-else-if="notFound"
      class="standings-page__state standings-page__state--not-found"
      role="alert"
    >
      <h1 class="standings-page__not-found-title">تورنمنت یافت نشد.</h1>
      <p class="standings-page__not-found-body">این تورنمنت وجود ندارد یا در دسترس عمومی نیست.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <template v-else-if="tournament">
      <!-- Compact tournament context -->
      <div class="standings-page__context">
        <NuxtLink :to="`/tournaments/${tournament.slug}`" class="standings-page__back-link">
          ← {{ tournament.title }}
        </NuxtLink>
        <span class="standings-page__context-status" :class="statusBadgeClass">
          {{ statusLabel }}
        </span>
        <nav class="standings-page__nav" aria-label="صفحات تورنمنت">
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/participants`"
            class="standings-page__nav-link"
          >
            شرکت‌کنندگان
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/matches`"
            class="standings-page__nav-link"
          >
            مسابقات
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/results`"
            class="standings-page__nav-link"
          >
            نتایج
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/standings`"
            class="standings-page__nav-link standings-page__nav-link--active"
          >
            جدول رده‌بندی
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/bracket`"
            class="standings-page__nav-link"
          >
            براکت
          </NuxtLink>
        </nav>
      </div>

      <h1 class="standings-page__title">جدول رده‌بندی</h1>

      <!-- Unavailable for manual format or empty standings -->
      <div v-if="standingsUnavailable" class="standings-page__unavailable" role="status">
        <p class="standings-page__unavailable-text">
          جدول رده‌بندی برای این فرمت تورنمنت در دسترس نیست.
        </p>
      </div>

      <!-- Empty state: format supports standings but none recorded yet -->
      <div v-else-if="!standingRows.length" class="standings-page__empty" role="status">
        <p class="standings-page__empty-text">هنوز رده‌بندی ثبت نشده است.</p>
      </div>

      <!-- Standings table -->
      <div v-else class="standings-page__table-wrapper">
        <table class="standings-page__table" aria-label="جدول رده‌بندی">
          <thead>
            <tr>
              <th class="standings-page__th standings-page__th--rank">رتبه</th>
              <th class="standings-page__th standings-page__th--name">بازیکن / تیم</th>
              <th class="standings-page__th standings-page__th--wins">برد</th>
              <th class="standings-page__th standings-page__th--losses">باخت</th>
              <th class="standings-page__th standings-page__th--points">امتیاز</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in standingRows"
              :key="row.participantId"
              class="standings-page__tr"
              :class="{ 'standings-page__tr--top': row.rank <= 3 }"
            >
              <td class="standings-page__td standings-page__td--rank">{{ row.rank }}</td>
              <td class="standings-page__td standings-page__td--name">{{ row.displayName }}</td>
              <td class="standings-page__td standings-page__td--wins">{{ row.wins }}</td>
              <td class="standings-page__td standings-page__td--losses">{{ row.losses }}</td>
              <td class="standings-page__td standings-page__td--points">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import type {
  PublicTournamentDto,
  TournamentStatus,
  TournamentStandingsDto,
  TournamentStandingDto,
} from '@dragon/types';

const route = useRoute();
const slug = route.params.slug as string;
const detail = useTournamentDetail();
const standingsApi = useTournamentStandings();
const runtimeConfig = useRuntimeConfig();

// ─── Fetch tournament + standings (SSR + CSR) ─────────────────────────────────

const {
  data,
  pending,
  error: fetchError,
} = await useAsyncData(`tournament-standings-${slug}`, async () => {
  try {
    const tournament = await detail.getBySlug(slug);
    const standings = await standingsApi.getStandings(slug);
    return { tournament, standings };
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const tournament = computed<PublicTournamentDto | null>(() => data.value?.tournament ?? null);
const standingsData = computed<TournamentStandingsDto | null>(() => data.value?.standings ?? null);
const standingRows = computed<readonly TournamentStandingDto[]>(
  () => standingsData.value?.standings ?? [],
);

const notFound = computed(() => !pending.value && !fetchError.value && !tournament.value);

// Standings are unavailable for manual format (server returns empty array).
// We show an honest "unavailable" message rather than an empty list.
const standingsUnavailable = computed(
  () => !fetchError.value && standingsData.value?.format === 'manual',
);

// ─── Labels / formatting ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشر شده',
  registration_open: 'ثبت‌نام باز',
  registration_closed: 'ثبت‌نام بسته',
  in_progress: 'در حال برگزاری',
  completed: 'پایان یافته',
  cancelled: 'لغو شده',
  archived: 'آرشیو شده',
};

const statusLabel = computed(() =>
  tournament.value ? (STATUS_LABELS[tournament.value.status] ?? tournament.value.status) : '',
);

const statusBadgeClass = computed(() => {
  const s = tournament.value?.status;
  if (s === 'in_progress') return 'dr-badge dr-badge-live';
  if (s === 'registration_open') return 'dr-badge dr-badge-success';
  if (s === 'cancelled') return 'dr-badge dr-badge-danger';
  return 'dr-badge';
});

// ─── SEO ─────────────────────────────────────────────────────────────────────

const siteName = (runtimeConfig.public?.siteName as string | undefined) ?? 'Dragon';

useHead(
  computed(() => {
    if (notFound.value) {
      return {
        title: 'تورنمنت یافت نشد',
        meta: [{ name: 'robots', content: 'noindex,follow' }],
      };
    }
    const t = tournament.value;
    if (!t) return { title: siteName };

    const title = `جدول رده‌بندی ${t.title} — ${siteName}`;
    const description = `جدول رده‌بندی تورنمنت ${t.title}.`;

    return {
      title,
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
      ],
    };
  }),
);
</script>

<style scoped>
.standings-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.standings-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.standings-page__state-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
}

.standings-page__not-found-title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0;
  color: var(--text-primary);
}

.standings-page__not-found-body {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.standings-page__context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.standings-page__back-link {
  font-size: var(--text-body-size);
  color: var(--text-link);
  text-decoration: none;
}

.standings-page__back-link:hover {
  text-decoration: underline;
}

.standings-page__nav {
  display: flex;
  gap: var(--space-2);
  margin-right: auto;
}

.standings-page__nav-link {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
}

.standings-page__nav-link:hover {
  color: var(--text-primary);
}

.standings-page__nav-link--active {
  color: var(--text-primary);
  background: var(--surface-card);
  font-weight: var(--weight-semibold);
}

.standings-page__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0 0 var(--space-6) 0;
  color: var(--text-primary);
}

.standings-page__unavailable {
  padding: var(--space-12) 0;
  text-align: center;
}

.standings-page__unavailable-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

.standings-page__empty {
  padding: var(--space-12) 0;
  text-align: center;
}

.standings-page__empty-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

.standings-page__table-wrapper {
  overflow-x: auto;
}

.standings-page__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-body-size);
}

.standings-page__th {
  text-align: right;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-caption-size);
  font-weight: var(--weight-semibold);
  color: var(--text-muted);
  border-bottom: 2px solid var(--border-default);
}

.standings-page__tr {
  border-bottom: 1px solid var(--border-default);
}

.standings-page__tr--top .standings-page__td--rank {
  font-weight: var(--weight-bold);
  color: var(--text-primary);
}

.standings-page__td {
  padding: var(--space-3) var(--space-4);
  color: var(--text-secondary);
}

.standings-page__td--name {
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.standings-page__td--points {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}
</style>
