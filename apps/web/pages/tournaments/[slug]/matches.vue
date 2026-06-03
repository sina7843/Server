<template>
  <main class="matches-page">
    <div v-if="pending" class="matches-page__state" role="status">
      <span class="matches-page__state-text">در حال بارگذاری...</span>
    </div>

    <div v-else-if="fetchError" class="matches-page__state matches-page__state--error" role="alert">
      <p class="matches-page__state-text">خطا در بارگذاری مسابقات.</p>
    </div>

    <div
      v-else-if="notFound"
      class="matches-page__state matches-page__state--not-found"
      role="alert"
    >
      <h1 class="matches-page__not-found-title">تورنمنت یافت نشد.</h1>
      <p class="matches-page__not-found-body">این تورنمنت وجود ندارد یا در دسترس عمومی نیست.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <template v-else-if="tournament">
      <!-- Compact tournament context -->
      <div class="matches-page__context">
        <NuxtLink :to="`/tournaments/${tournament.slug}`" class="matches-page__back-link">
          ← {{ tournament.title }}
        </NuxtLink>
        <span class="matches-page__context-status" :class="statusBadgeClass">
          {{ statusLabel }}
        </span>
        <nav class="matches-page__nav" aria-label="صفحات تورنمنت">
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/participants`"
            class="matches-page__nav-link"
          >
            شرکت‌کنندگان
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/matches`"
            class="matches-page__nav-link matches-page__nav-link--active"
          >
            مسابقات
          </NuxtLink>
          <NuxtLink :to="`/tournaments/${tournament.slug}/results`" class="matches-page__nav-link">
            نتایج
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/standings`"
            class="matches-page__nav-link"
          >
            جدول رده‌بندی
          </NuxtLink>
          <NuxtLink :to="`/tournaments/${tournament.slug}/bracket`" class="matches-page__nav-link">
            براکت
          </NuxtLink>
        </nav>
      </div>

      <h1 class="matches-page__title">مسابقات</h1>

      <!-- Empty state -->
      <div v-if="!matches.length" class="matches-page__empty" role="status">
        <p class="matches-page__empty-text">هنوز مسابقه‌ای تولید نشده است.</p>
      </div>

      <!-- Matches grouped by round -->
      <div v-else class="matches-page__rounds">
        <section
          v-for="round in rounds"
          :key="round.number"
          class="matches-page__round"
          :aria-label="`دور ${round.number}`"
        >
          <h2 class="matches-page__round-title">دور {{ round.number }}</h2>
          <ul class="matches-page__match-list">
            <li v-for="match in round.matches" :key="match.id" class="matches-page__match">
              <div class="matches-page__match-header">
                <span class="matches-page__match-number">مسابقه {{ match.matchNumber }}</span>
                <span
                  class="matches-page__match-status dr-badge"
                  :class="matchStatusClass(match.status)"
                >
                  {{ matchStatusLabel(match.status) }}
                </span>
              </div>
              <div class="matches-page__match-body">
                <div
                  class="matches-page__match-participant"
                  :class="{
                    'matches-page__match-participant--winner':
                      match.winnerId && match.winnerId === match.participant1Id,
                  }"
                >
                  <span class="matches-page__match-participant-name">
                    {{ resolveParticipantName(match.participant1Id) }}
                  </span>
                  <span
                    v-if="match.winnerId && match.winnerId === match.participant1Id"
                    class="matches-page__match-winner-badge"
                  >
                    برنده
                  </span>
                </div>
                <span class="matches-page__match-vs">vs</span>
                <div
                  class="matches-page__match-participant"
                  :class="{
                    'matches-page__match-participant--winner':
                      match.winnerId && match.winnerId === match.participant2Id,
                  }"
                >
                  <span class="matches-page__match-participant-name">
                    {{ resolveParticipantName(match.participant2Id) }}
                  </span>
                  <span
                    v-if="match.winnerId && match.winnerId === match.participant2Id"
                    class="matches-page__match-winner-badge"
                  >
                    برنده
                  </span>
                </div>
              </div>
              <div v-if="match.scheduledAt" class="matches-page__match-time">
                {{ formatDate(match.scheduledAt) }}
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
  TournamentMatchStatus,
  PublicTournamentMatchDto,
  TournamentParticipantPublicDto,
} from '@dragon/types';

const route = useRoute();
const slug = route.params.slug as string;
const detail = useTournamentDetail();
const matchesApi = useTournamentMatches();
const runtimeConfig = useRuntimeConfig();

// ─── Fetch tournament + participants + matches (SSR + CSR) ────────────────────

const {
  data,
  pending,
  error: fetchError,
} = await useAsyncData(`tournament-matches-${slug}`, async () => {
  try {
    const tournament = await detail.getBySlug(slug);
    const [participantsResult, matchesResult] = await Promise.all([
      matchesApi.getParticipants(slug),
      matchesApi.getMatches(slug),
    ]);
    return { tournament, participants: participantsResult.items, matches: matchesResult.items };
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const tournament = computed<PublicTournamentDto | null>(() => data.value?.tournament ?? null);
const matches = computed<readonly PublicTournamentMatchDto[]>(() => data.value?.matches ?? []);
const participantMap = computed<Map<string, TournamentParticipantPublicDto>>(() => {
  const map = new Map<string, TournamentParticipantPublicDto>();
  for (const p of data.value?.participants ?? []) {
    map.set(p.id, p);
  }
  return map;
});

const notFound = computed(() => !pending.value && !fetchError.value && !tournament.value);

// ─── Round grouping ───────────────────────────────────────────────────────────

interface RoundGroup {
  number: number;
  matches: readonly PublicTournamentMatchDto[];
}

const rounds = computed<RoundGroup[]>(() => {
  const grouped = new Map<number, PublicTournamentMatchDto[]>();
  for (const match of matches.value) {
    const existing = grouped.get(match.round) ?? [];
    existing.push(match);
    grouped.set(match.round, existing);
  }
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([number, matchList]) => ({
      number,
      matches: matchList.sort((a, b) => a.matchNumber - b.matchNumber),
    }));
});

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

const MATCH_STATUS_LABELS: Record<TournamentMatchStatus, string> = {
  scheduled: 'برنامه‌ریزی شده',
  in_progress: 'در جریان',
  completed: 'پایان یافته',
  cancelled: 'لغو شده',
};

function matchStatusLabel(status: TournamentMatchStatus): string {
  return MATCH_STATUS_LABELS[status] ?? status;
}

function matchStatusClass(status: TournamentMatchStatus): string {
  if (status === 'in_progress') return 'dr-badge-live';
  if (status === 'completed') return 'dr-badge-success';
  if (status === 'cancelled') return 'dr-badge-danger';
  return '';
}

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

    const title = `مسابقات ${t.title} — ${siteName}`;
    const description = `برنامه مسابقات تورنمنت ${t.title}.`;

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
.matches-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.matches-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.matches-page__state-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
}

.matches-page__not-found-title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0;
  color: var(--text-primary);
}

.matches-page__not-found-body {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.matches-page__context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.matches-page__back-link {
  font-size: var(--text-body-size);
  color: var(--text-link);
  text-decoration: none;
}

.matches-page__back-link:hover {
  text-decoration: underline;
}

.matches-page__nav {
  display: flex;
  gap: var(--space-2);
  margin-right: auto;
}

.matches-page__nav-link {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
}

.matches-page__nav-link:hover {
  color: var(--text-primary);
}

.matches-page__nav-link--active {
  color: var(--text-primary);
  background: var(--surface-card);
  font-weight: var(--weight-semibold);
}

.matches-page__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0 0 var(--space-6) 0;
  color: var(--text-primary);
}

.matches-page__empty {
  padding: var(--space-12) 0;
  text-align: center;
}

.matches-page__empty-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

.matches-page__rounds {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.matches-page__round-title {
  font-size: var(--text-h3-size);
  font-weight: var(--weight-semibold);
  margin: 0 0 var(--space-4) 0;
  color: var(--text-primary);
}

.matches-page__match-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.matches-page__match {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.matches-page__match-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.matches-page__match-number {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}

.matches-page__match-status {
  font-size: var(--text-caption-size);
}

.matches-page__match-body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.matches-page__match-participant {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.matches-page__match-participant--winner .matches-page__match-participant-name {
  font-weight: var(--weight-bold);
  color: var(--text-primary);
}

.matches-page__match-participant-name {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
}

.matches-page__match-winner-badge {
  font-size: var(--text-caption-size);
  color: var(--color-success, #22c55e);
  font-weight: var(--weight-semibold);
}

.matches-page__match-vs {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-sans-en);
  flex-shrink: 0;
}

.matches-page__match-time {
  margin-top: var(--space-2);
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}
</style>
