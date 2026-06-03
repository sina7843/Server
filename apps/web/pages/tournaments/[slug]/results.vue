<template>
  <main class="results-page">
    <div v-if="pending" class="results-page__state" role="status">
      <span class="results-page__state-text">در حال بارگذاری...</span>
    </div>

    <div
      v-else-if="notFound"
      class="results-page__state results-page__state--not-found"
      role="alert"
    >
      <h1 class="results-page__not-found-title">تورنمنت یافت نشد.</h1>
      <p class="results-page__not-found-body">این تورنمنت وجود ندارد یا در دسترس عمومی نیست.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <template v-else-if="tournament">
      <!-- Compact tournament context -->
      <div class="results-page__context">
        <NuxtLink :to="`/tournaments/${tournament.slug}`" class="results-page__back-link">
          ← {{ tournament.title }}
        </NuxtLink>
        <span class="results-page__context-status" :class="statusBadgeClass">
          {{ statusLabel }}
        </span>
        <nav class="results-page__nav" aria-label="صفحات تورنمنت">
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/participants`"
            class="results-page__nav-link"
          >
            شرکت‌کنندگان
          </NuxtLink>
          <NuxtLink :to="`/tournaments/${tournament.slug}/matches`" class="results-page__nav-link">
            مسابقات
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/results`"
            class="results-page__nav-link results-page__nav-link--active"
          >
            نتایج
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/standings`"
            class="results-page__nav-link"
          >
            جدول رده‌بندی
          </NuxtLink>
          <NuxtLink :to="`/tournaments/${tournament.slug}/bracket`" class="results-page__nav-link">
            براکت
          </NuxtLink>
        </nav>
      </div>

      <h1 class="results-page__title">نتایج مسابقات</h1>

      <!-- Error state -->
      <div v-if="fetchError" class="results-page__state results-page__state--error" role="alert">
        <p class="results-page__state-text">خطا در بارگذاری نتایج.</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!results.length" class="results-page__empty" role="status">
        <p class="results-page__empty-text">هنوز نتیجه‌ای ثبت نشده است.</p>
      </div>

      <!-- Results list -->
      <ul v-else class="results-page__list">
        <li v-for="result in results" :key="result.matchId" class="results-page__item">
          <div class="results-page__item-winner">
            <span class="results-page__item-label">برنده:</span>
            <span class="results-page__item-winner-name">
              {{ resolveParticipantName(result.winnerId) }}
            </span>
          </div>
          <div
            v-if="result.participant1Score !== undefined || result.participant2Score !== undefined"
            class="results-page__item-score"
          >
            <span class="results-page__item-score-value">
              {{ result.participant1Score ?? '—' }} : {{ result.participant2Score ?? '—' }}
            </span>
          </div>
          <div class="results-page__item-date">
            {{ formatDate(result.recordedAt) }}
          </div>
        </li>
      </ul>
    </template>
  </main>
</template>

<script setup lang="ts">
import type {
  PublicTournamentDto,
  TournamentStatus,
  TournamentMatchResultDto,
  TournamentParticipantPublicDto,
} from '@dragon/types';

const route = useRoute();
const slug = route.params.slug as string;
const detail = useTournamentDetail();
const resultsApi = useTournamentResults();
const runtimeConfig = useRuntimeConfig();

// ─── Fetch tournament + participants + results (SSR + CSR) ────────────────────

const {
  data,
  pending,
  error: fetchError,
} = await useAsyncData(`tournament-results-${slug}`, async () => {
  try {
    const tournament = await detail.getBySlug(slug);
    const [participantsResult, results] = await Promise.all([
      resultsApi.getParticipants(slug),
      resultsApi.getResults(slug),
    ]);
    return { tournament, participants: participantsResult.items, results };
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const tournament = computed<PublicTournamentDto | null>(() => data.value?.tournament ?? null);
const results = computed<readonly TournamentMatchResultDto[]>(() => data.value?.results ?? []);
const participantMap = computed<Map<string, TournamentParticipantPublicDto>>(() => {
  const map = new Map<string, TournamentParticipantPublicDto>();
  for (const p of data.value?.participants ?? []) {
    map.set(p.id, p);
  }
  return map;
});

const notFound = computed(() => !pending.value && (!tournament.value || !!fetchError.value));

// ─── Participant name resolution ──────────────────────────────────────────────

function resolveParticipantName(participantId?: string): string {
  if (!participantId) return 'TBD';
  const participant = participantMap.value.get(participantId);
  return participant?.displayName ?? 'TBD';
}

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

    const title = `نتایج ${t.title} — ${siteName}`;
    const description = `نتایج مسابقات تورنمنت ${t.title}.`;

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
.results-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.results-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.results-page__state-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
}

.results-page__not-found-title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0;
  color: var(--text-primary);
}

.results-page__not-found-body {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.results-page__context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.results-page__back-link {
  font-size: var(--text-body-size);
  color: var(--text-link);
  text-decoration: none;
}

.results-page__back-link:hover {
  text-decoration: underline;
}

.results-page__nav {
  display: flex;
  gap: var(--space-2);
  margin-right: auto;
}

.results-page__nav-link {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
}

.results-page__nav-link:hover {
  color: var(--text-primary);
}

.results-page__nav-link--active {
  color: var(--text-primary);
  background: var(--surface-card);
  font-weight: var(--weight-semibold);
}

.results-page__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0 0 var(--space-6) 0;
  color: var(--text-primary);
}

.results-page__empty {
  padding: var(--space-12) 0;
  text-align: center;
}

.results-page__empty-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

.results-page__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.results-page__item {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.results-page__item-winner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
}

.results-page__item-label {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}

.results-page__item-winner-name {
  font-size: var(--text-body-size);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.results-page__item-score {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  font-family: var(--font-sans-en);
}

.results-page__item-score-value {
  font-weight: var(--weight-semibold);
}

.results-page__item-date {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}
</style>
