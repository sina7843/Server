<template>
  <main class="bracket-page">
    <div v-if="pending" class="bracket-page__state" role="status">
      <span class="bracket-page__state-text">در حال بارگذاری...</span>
    </div>

    <div
      v-else-if="notFound"
      class="bracket-page__state bracket-page__state--not-found"
      role="alert"
    >
      <h1 class="bracket-page__not-found-title">تورنمنت یافت نشد.</h1>
      <p class="bracket-page__not-found-body">این تورنمنت وجود ندارد یا در دسترس عمومی نیست.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <template v-else-if="tournament">
      <!-- Compact tournament context -->
      <div class="bracket-page__context">
        <NuxtLink :to="`/tournaments/${tournament.slug}`" class="bracket-page__back-link">
          ← {{ tournament.title }}
        </NuxtLink>
        <span class="bracket-page__context-status" :class="statusBadgeClass">
          {{ statusLabel }}
        </span>
        <nav class="bracket-page__nav" aria-label="صفحات تورنمنت">
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/participants`"
            class="bracket-page__nav-link"
          >
            شرکت‌کنندگان
          </NuxtLink>
          <NuxtLink :to="`/tournaments/${tournament.slug}/matches`" class="bracket-page__nav-link">
            مسابقات
          </NuxtLink>
          <NuxtLink :to="`/tournaments/${tournament.slug}/results`" class="bracket-page__nav-link">
            نتایج
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/standings`"
            class="bracket-page__nav-link"
          >
            جدول رده‌بندی
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/bracket`"
            class="bracket-page__nav-link bracket-page__nav-link--active"
          >
            براکت
          </NuxtLink>
        </nav>
      </div>

      <h1 class="bracket-page__title">براکت تورنمنت</h1>

      <!-- Error state -->
      <div v-if="fetchError" class="bracket-page__state bracket-page__state--error" role="alert">
        <p class="bracket-page__state-text">خطا در بارگذاری براکت.</p>
      </div>

      <!-- Empty / unavailable state: bracket is unavailable until matches exist -->
      <div v-else-if="!rounds.length" class="bracket-page__unavailable" role="status">
        <p class="bracket-page__unavailable-text">براکت تا زمان ایجاد مسابقات در دسترس نیست.</p>
      </div>

      <!-- Bracket rounds -->
      <div v-else class="bracket-page__rounds">
        <section
          v-for="round in rounds"
          :key="round.round"
          class="bracket-page__round"
          :aria-label="roundLabel(round.label)"
        >
          <h2 class="bracket-page__round-title">{{ roundLabel(round.label) }}</h2>
          <ul class="bracket-page__match-list">
            <li v-for="match in round.matches" :key="match.matchId" class="bracket-page__match">
              <div class="bracket-page__match-header">
                <span class="bracket-page__match-number">مسابقه {{ match.matchNumber }}</span>
                <span
                  class="bracket-page__match-status dr-badge"
                  :class="matchStatusClass(match.status)"
                >
                  {{ matchStatusLabel(match.status) }}
                </span>
              </div>
              <div class="bracket-page__match-body">
                <!-- Participant 1 -->
                <div
                  class="bracket-page__participant"
                  :class="{
                    'bracket-page__participant--winner':
                      match.winnerId &&
                      match.participant1 &&
                      match.winnerId === match.participant1.participantId,
                  }"
                >
                  <span v-if="match.participant1?.seed" class="bracket-page__participant-seed">
                    #{{ match.participant1.seed }}
                  </span>
                  <span class="bracket-page__participant-name">
                    {{ match.participant1?.displayName ?? 'TBD' }}
                  </span>
                  <span
                    v-if="
                      match.winnerId &&
                      match.participant1 &&
                      match.winnerId === match.participant1.participantId
                    "
                    class="bracket-page__winner-badge"
                  >
                    برنده
                  </span>
                </div>

                <span class="bracket-page__vs">vs</span>

                <!-- Participant 2 -->
                <div
                  class="bracket-page__participant"
                  :class="{
                    'bracket-page__participant--winner':
                      match.winnerId &&
                      match.participant2 &&
                      match.winnerId === match.participant2.participantId,
                  }"
                >
                  <span v-if="match.participant2?.seed" class="bracket-page__participant-seed">
                    #{{ match.participant2.seed }}
                  </span>
                  <span class="bracket-page__participant-name">
                    {{ match.participant2?.displayName ?? 'TBD' }}
                  </span>
                  <span
                    v-if="
                      match.winnerId &&
                      match.participant2 &&
                      match.winnerId === match.participant2.participantId
                    "
                    class="bracket-page__winner-badge"
                  >
                    برنده
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import type {
  PublicTournamentDto,
  TournamentStatus,
  TournamentBracketDto,
  BracketRoundDto,
} from '@dragon/types';

const route = useRoute();
const slug = route.params.slug as string;
const detail = useTournamentDetail();
const bracketApi = useTournamentBracket();
const runtimeConfig = useRuntimeConfig();

// ─── Fetch tournament + bracket (SSR + CSR) ───────────────────────────────────

const {
  data,
  pending,
  error: fetchError,
} = await useAsyncData(`tournament-bracket-${slug}`, async () => {
  try {
    const tournament = await detail.getBySlug(slug);
    const bracket = await bracketApi.getBracket(slug);
    return { tournament, bracket };
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const tournament = computed<PublicTournamentDto | null>(() => data.value?.tournament ?? null);
const bracketData = computed<TournamentBracketDto | null>(() => data.value?.bracket ?? null);
const rounds = computed<readonly BracketRoundDto[]>(() => bracketData.value?.rounds ?? []);

const notFound = computed(() => !pending.value && (!tournament.value || !!fetchError.value));

// ─── Round label mapping (backend provides English; map to Persian) ───────────

const ROUND_LABEL_MAP: Record<string, string> = {
  Final: 'فینال',
  Semifinal: 'نیمه‌نهایی',
  Quarterfinal: 'ربع‌نهایی',
};

function roundLabel(label: string): string {
  if (label in ROUND_LABEL_MAP) return ROUND_LABEL_MAP[label];
  // "Round N" → "دور N"
  const match = label.match(/^Round (\d+)$/);
  if (match) return `دور ${match[1]}`;
  return label;
}

// ─── Match status labels / classes ───────────────────────────────────────────

const MATCH_STATUS_LABELS: Record<string, string> = {
  scheduled: 'برنامه‌ریزی شده',
  in_progress: 'در جریان',
  completed: 'پایان یافته',
  cancelled: 'لغو شده',
};

function matchStatusLabel(status: string): string {
  return MATCH_STATUS_LABELS[status] ?? status;
}

function matchStatusClass(status: string): string {
  if (status === 'in_progress') return 'dr-badge-live';
  if (status === 'completed') return 'dr-badge-success';
  if (status === 'cancelled') return 'dr-badge-danger';
  return '';
}

// ─── Tournament status label / badge ─────────────────────────────────────────

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

    const title = `براکت ${t.title} — ${siteName}`;
    const description = `براکت تورنمنت ${t.title}.`;

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
.bracket-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.bracket-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.bracket-page__state-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
}

.bracket-page__not-found-title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0;
  color: var(--text-primary);
}

.bracket-page__not-found-body {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.bracket-page__context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.bracket-page__back-link {
  font-size: var(--text-body-size);
  color: var(--text-link);
  text-decoration: none;
}

.bracket-page__back-link:hover {
  text-decoration: underline;
}

.bracket-page__nav {
  display: flex;
  gap: var(--space-2);
  margin-right: auto;
  flex-wrap: wrap;
}

.bracket-page__nav-link {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
}

.bracket-page__nav-link:hover {
  color: var(--text-primary);
}

.bracket-page__nav-link--active {
  color: var(--text-primary);
  background: var(--surface-card);
  font-weight: var(--weight-semibold);
}

.bracket-page__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0 0 var(--space-6) 0;
  color: var(--text-primary);
}

.bracket-page__unavailable {
  padding: var(--space-12) 0;
  text-align: center;
}

.bracket-page__unavailable-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

.bracket-page__rounds {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.bracket-page__round-title {
  font-size: var(--text-h3-size);
  font-weight: var(--weight-semibold);
  margin: 0 0 var(--space-4) 0;
  color: var(--text-primary);
}

.bracket-page__match-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bracket-page__match {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.bracket-page__match-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.bracket-page__match-number {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}

.bracket-page__match-status {
  font-size: var(--text-caption-size);
}

.bracket-page__match-body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.bracket-page__participant {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.bracket-page__participant--winner .bracket-page__participant-name {
  font-weight: var(--weight-bold);
  color: var(--text-primary);
}

.bracket-page__participant-seed {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-sans-en);
  min-width: 2rem;
}

.bracket-page__participant-name {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
}

.bracket-page__winner-badge {
  font-size: var(--text-caption-size);
  color: var(--color-success, #22c55e);
  font-weight: var(--weight-semibold);
}

.bracket-page__vs {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-sans-en);
  flex-shrink: 0;
}
</style>
