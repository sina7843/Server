<template>
  <div class="mp">

    <!-- Loading skeleton -->
    <div v-if="pending" class="mp-loading" aria-busy="true">
      <div v-for="i in 3" :key="i" class="mp-skel-card">
        <div class="mp-skel-card__header">
          <div class="mp-skel mp-skel--label"></div>
          <div class="mp-skel mp-skel--badge"></div>
        </div>
        <div class="mp-skel-card__body">
          <div class="mp-skel mp-skel--name"></div>
          <div class="mp-skel mp-skel--vs"></div>
          <div class="mp-skel mp-skel--name"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="mp-state mp-state--error" role="alert">
      <p class="mp-state__text">خطا در بارگذاری مسابقات.</p>
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="mp-state" role="alert">
      <p class="mp-state__text">تورنمنت یافت نشد.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <!-- Content -->
    <template v-else-if="tournament">
      <!-- Header -->
      <div class="mp-header">
        <h2 class="mp-title">مسابقات</h2>
      </div>

      <!-- Empty -->
      <div v-if="!matches.length" class="mp-empty" role="status">
        <div class="mp-empty__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <p class="mp-empty__text">هنوز مسابقه‌ای تولید نشده است.</p>
      </div>

      <!-- Rounds -->
      <div v-else class="mp-rounds">
        <section
          v-for="round in rounds"
          :key="round.number"
          class="mp-round"
          :aria-label="`دور ${round.number}`"
        >
          <!-- Round heading -->
          <div class="mp-round__heading">
            <span class="mp-round__label">دور {{ round.number }}</span>
            <div class="mp-round__line" aria-hidden="true"></div>
          </div>

          <!-- Matches grid -->
          <ul class="mp-grid">
            <li v-for="match in round.matches" :key="match.id" class="mp-card"
                :class="{ 'mp-card--live': match.status === 'in_progress' }">

              <!-- Card header: match # + status -->
              <div class="mp-card__top">
                <span class="mp-card__num">مسابقه {{ match.matchNumber }}</span>
                <span class="dr-badge" :class="matchStatusClass(match.status)">
                  {{ matchStatusLabel(match.status) }}
                </span>
              </div>

              <!-- VS row -->
              <div class="mp-card__vs-row">
                <!-- P1 -->
                <div class="mp-participant"
                     :class="{ 'mp-participant--winner': match.winnerId && match.winnerId === match.participant1Id }">
                  <span class="mp-participant__name">{{ resolveParticipantName(match.participant1Id) }}</span>
                  <span v-if="match.winnerId && match.winnerId === match.participant1Id" class="mp-participant__crown" aria-label="برنده">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 20h18l-3-12-4.5 6L12 8l-1.5 6L6 8 3 20z" />
                    </svg>
                  </span>
                </div>

                <!-- VS divider -->
                <span class="mp-vs" aria-hidden="true">vs</span>

                <!-- P2 -->
                <div class="mp-participant mp-participant--p2"
                     :class="{ 'mp-participant--winner': match.winnerId && match.winnerId === match.participant2Id }">
                  <span v-if="match.winnerId && match.winnerId === match.participant2Id" class="mp-participant__crown" aria-label="برنده">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M3 20h18l-3-12-4.5 6L12 8l-1.5 6L6 8 3 20z" />
                    </svg>
                  </span>
                  <span class="mp-participant__name">{{ resolveParticipantName(match.participant2Id) }}</span>
                </div>
              </div>

              <!-- Scheduled time -->
              <div v-if="match.scheduledAt" class="mp-card__time">
                {{ formatDate(match.scheduledAt) }}
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
.mp {
  padding: var(--space-6) 0 var(--space-16);
}

/* ── States ──────────────────────────────────────────────────────────────── */
.mp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.mp-state--error .mp-state__text { color: var(--danger-400); }
.mp-state__text { font-size: var(--text-body-size); color: var(--text-muted); margin: 0; }

/* ── Loading skeleton ────────────────────────────────────────────────────── */
.mp-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) 0;
}

.mp-skel-card {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mp-skel-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.mp-skel-card__body {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.mp-skel {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: mp-shimmer 1.6s ease-in-out infinite;
}

@keyframes mp-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.mp-skel--label { height: 12px; width: 80px; }
.mp-skel--badge { height: 22px; width: 60px; border-radius: var(--radius-pill); }
.mp-skel--name  { flex: 1; height: 16px; }
.mp-skel--vs    { height: 14px; width: 24px; flex-shrink: 0; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.mp-header {
  margin-bottom: var(--space-6);
}

.mp-title {
  font-family: var(--font-display);
  font-size: var(--text-h3-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--text-h3-tracking);
}

/* ── Empty ───────────────────────────────────────────────────────────────── */
.mp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
  color: var(--text-disabled);
}

.mp-empty__text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

/* ── Rounds ──────────────────────────────────────────────────────────────── */
.mp-rounds {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.mp-round__heading {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.mp-round__label {
  font-size: var(--text-caption-size);
  font-weight: var(--weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.mp-round__line {
  flex: 1;
  height: 1px;
  background: var(--glass-hairline);
}

/* ── Match grid ──────────────────────────────────────────────────────────── */
.mp-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
}

/* ── Match card ──────────────────────────────────────────────────────────── */
.mp-card {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: border-color var(--motion-fast) var(--ease-out);
}

.mp-card:hover {
  border-color: rgba(124, 58, 237, 0.3);
}

.mp-card--live {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.mp-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.mp-card__num {
  font-size: 11px;
  color: var(--text-disabled);
  font-family: var(--font-mono);
}

/* ── VS row ──────────────────────────────────────────────────────────────── */
.mp-card__vs-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 36px;
}

.mp-participant {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.mp-participant--p2 {
  justify-content: flex-end;
}

.mp-participant__name {
  font-size: var(--text-body-sm-size);
  color: var(--text-secondary);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mp-participant--winner .mp-participant__name {
  color: var(--text-primary);
  font-weight: var(--weight-bold);
}

.mp-participant__crown {
  color: #F59E0B;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.mp-vs {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  color: var(--text-disabled);
  letter-spacing: 0.05em;
  flex-shrink: 0;
  padding: 0 4px;
}

.mp-card__time {
  font-size: 11px;
  color: var(--text-disabled);
  font-family: var(--font-mono);
  border-top: 1px solid var(--glass-hairline);
  padding-top: var(--space-2);
}

@media (max-width: 600px) {
  .mp-grid {
    grid-template-columns: 1fr;
  }
}
</style>
