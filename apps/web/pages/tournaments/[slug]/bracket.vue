<template>
  <div class="bp">

    <!-- Loading skeleton -->
    <div v-if="pending" class="bp-loading" aria-busy="true">
      <div v-for="i in 2" :key="i" class="bp-skel-section">
        <div class="bp-skel bp-skel--heading"></div>
        <div class="bp-grid">
          <div v-for="j in 3" :key="j" class="bp-skel-card">
            <div class="bp-skel bp-skel--label"></div>
            <div class="bp-skel-vs">
              <div class="bp-skel bp-skel--name"></div>
              <div class="bp-skel bp-skel--vs"></div>
              <div class="bp-skel bp-skel--name"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="bp-state bp-state--error" role="alert">
      <p class="bp-state__text">خطا در بارگذاری براکت.</p>
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="bp-state" role="alert">
      <p class="bp-state__text">تورنمنت یافت نشد.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <!-- Content -->
    <template v-else-if="tournament">
      <!-- Header -->
      <div class="bp-header">
        <h2 class="bp-title">براکت تورنمنت</h2>
      </div>

      <!-- Empty / unavailable -->
      <div v-if="!rounds.length" class="bp-empty" role="status">
        <div class="bp-empty__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" />
          </svg>
        </div>
        <p class="bp-empty__text">براکت تا زمان ایجاد مسابقات در دسترس نیست.</p>
      </div>

      <!-- Bracket rounds -->
      <div v-else class="bp-rounds">
        <section
          v-for="round in rounds"
          :key="round.round"
          class="bp-round"
          :aria-label="roundLabel(round.label)"
        >
          <!-- Round heading -->
          <div class="bp-round__heading">
            <span class="bp-round__label">{{ roundLabel(round.label) }}</span>
            <div class="bp-round__line" aria-hidden="true"></div>
          </div>

          <!-- Match grid -->
          <ul class="bp-grid">
            <li v-for="match in round.matches" :key="match.matchId" class="bp-card"
                :class="{ 'bp-card--live': match.status === 'in_progress', 'bp-card--done': match.status === 'completed' }">

              <!-- Card header -->
              <div class="bp-card__top">
                <span class="bp-card__num">مسابقه {{ match.matchNumber }}</span>
                <span class="dr-badge" :class="matchStatusClass(match.status)">
                  {{ matchStatusLabel(match.status) }}
                </span>
              </div>

              <!-- Participants -->
              <div class="bp-card__participants">

                <!-- Participant 1 -->
                <div
                  class="bp-participant"
                  :class="{
                    'bp-participant--winner':
                      match.winnerId && match.participant1 &&
                      match.winnerId === match.participant1.participantId,
                    'bp-participant--loser':
                      match.winnerId && match.participant1 &&
                      match.winnerId !== match.participant1.participantId,
                  }"
                >
                  <div class="bp-participant__left">
                    <span v-if="match.participant1?.seed" class="bp-participant__seed">
                      #{{ match.participant1.seed }}
                    </span>
                    <span class="bp-participant__name">
                      {{ match.participant1?.displayName ?? 'TBD' }}
                    </span>
                  </div>
                  <span
                    v-if="match.winnerId && match.participant1 && match.winnerId === match.participant1.participantId"
                    class="bp-participant__crown"
                    aria-label="برنده"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 20h18l-3-12-4.5 6L12 8l-1.5 6L6 8 3 20z" />
                    </svg>
                  </span>
                </div>

                <!-- VS separator -->
                <div class="bp-vs-sep" aria-hidden="true">
                  <div class="bp-vs-sep__line"></div>
                  <span class="bp-vs-sep__text">vs</span>
                  <div class="bp-vs-sep__line"></div>
                </div>

                <!-- Participant 2 -->
                <div
                  class="bp-participant"
                  :class="{
                    'bp-participant--winner':
                      match.winnerId && match.participant2 &&
                      match.winnerId === match.participant2.participantId,
                    'bp-participant--loser':
                      match.winnerId && match.participant2 &&
                      match.winnerId !== match.participant2.participantId,
                  }"
                >
                  <div class="bp-participant__left">
                    <span v-if="match.participant2?.seed" class="bp-participant__seed">
                      #{{ match.participant2.seed }}
                    </span>
                    <span class="bp-participant__name">
                      {{ match.participant2?.displayName ?? 'TBD' }}
                    </span>
                  </div>
                  <span
                    v-if="match.winnerId && match.participant2 && match.winnerId === match.participant2.participantId"
                    class="bp-participant__crown"
                    aria-label="برنده"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 20h18l-3-12-4.5 6L12 8l-1.5 6L6 8 3 20z" />
                    </svg>
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
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

const notFound = computed(() => !pending.value && !fetchError.value && !tournament.value);

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
.bp {
  padding: var(--space-6) 0 var(--space-16);
}

/* ── States ──────────────────────────────────────────────────────────────── */
.bp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.bp-state--error .bp-state__text { color: var(--danger-400); }
.bp-state__text { font-size: var(--text-body-size); color: var(--text-muted); margin: 0; }

/* ── Loading skeleton ────────────────────────────────────────────────────── */
.bp-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-4) 0;
}

.bp-skel-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bp-skel-card {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bp-skel-vs {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.bp-skel {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: bp-shimmer 1.6s ease-in-out infinite;
}

@keyframes bp-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.bp-skel--heading { height: 16px; width: 100px; }
.bp-skel--label   { height: 12px; width: 80px; }
.bp-skel--name    { height: 16px; width: 100%; }
.bp-skel--vs      { height: 10px; width: 24px; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.bp-header {
  margin-bottom: var(--space-6);
}

.bp-title {
  font-family: var(--font-display);
  font-size: var(--text-h3-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--text-h3-tracking);
}

/* ── Empty ───────────────────────────────────────────────────────────────── */
.bp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
  color: var(--text-disabled);
}

.bp-empty__text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

/* ── Rounds ──────────────────────────────────────────────────────────────── */
.bp-rounds {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.bp-round__heading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.bp-round__label {
  font-size: var(--text-caption-size);
  font-weight: var(--weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.bp-round__line {
  flex: 1;
  height: 1px;
  background: var(--glass-hairline);
}

/* ── Grid ────────────────────────────────────────────────────────────────── */
.bp-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-3);
}

/* ── Match card ──────────────────────────────────────────────────────────── */
.bp-card {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: border-color var(--motion-fast) var(--ease-out);
}

.bp-card:hover {
  border-color: rgba(124, 58, 237, 0.3);
}

.bp-card--live {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.12);
}

.bp-card--done {
  opacity: 0.85;
}

.bp-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bp-card__num {
  font-size: 11px;
  color: var(--text-disabled);
  font-family: var(--font-mono);
}

/* ── Participants ────────────────────────────────────────────────────────── */
.bp-card__participants {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.bp-participant {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 8px 10px;
  border-radius: var(--radius-md);
  transition: background var(--motion-fast) var(--ease-out);
}

.bp-participant--winner {
  background: rgba(74, 222, 128, 0.06);
}

.bp-participant--loser {
  opacity: 0.5;
}

.bp-participant__left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.bp-participant__seed {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-disabled);
  flex-shrink: 0;
}

.bp-participant__name {
  font-size: var(--text-body-sm-size);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bp-participant--winner .bp-participant__name {
  color: var(--text-primary);
  font-weight: var(--weight-bold);
}

.bp-participant__crown {
  color: #F59E0B;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* VS separator */
.bp-vs-sep {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
}

.bp-vs-sep__line {
  flex: 1;
  height: 1px;
  background: var(--glass-hairline);
}

.bp-vs-sep__text {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-disabled);
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .bp-grid {
    grid-template-columns: 1fr;
  }
}
</style>
