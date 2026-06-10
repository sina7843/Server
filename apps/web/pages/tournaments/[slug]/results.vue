<template>
  <div class="rp">

    <!-- Loading skeleton -->
    <div v-if="pending" class="rp-loading" aria-busy="true">
      <div v-for="i in 4" :key="i" class="rp-skel-card">
        <div class="rp-skel rp-skel--winner"></div>
        <div class="rp-skel rp-skel--score"></div>
        <div class="rp-skel rp-skel--date"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="rp-state rp-state--error" role="alert">
      <p class="rp-state__text">خطا در بارگذاری نتایج.</p>
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="rp-state" role="alert">
      <p class="rp-state__text">تورنمنت یافت نشد.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <!-- Content -->
    <template v-else-if="tournament">
      <!-- Header -->
      <div class="rp-header">
        <h2 class="rp-title">نتایج مسابقات</h2>
        <span v-if="results.length" class="rp-count">{{ results.length }} نتیجه</span>
      </div>

      <!-- Empty -->
      <div v-if="!results.length" class="rp-empty" role="status">
        <div class="rp-empty__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <p class="rp-empty__text">هنوز نتیجه‌ای ثبت نشده است.</p>
      </div>

      <!-- Results list -->
      <ul v-else class="rp-list">
        <li v-for="result in results" :key="result.matchId" class="rp-card">
          <!-- Winner -->
          <div class="rp-card__winner">
            <div class="rp-card__winner-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3 20h18l-3-12-4.5 6L12 8l-1.5 6L6 8 3 20z" />
              </svg>
              <span>برنده</span>
            </div>
            <span class="rp-card__winner-name">{{ resolveParticipantName(result.winnerId) }}</span>
          </div>

          <!-- Score -->
          <div
            v-if="result.participant1Score !== undefined || result.participant2Score !== undefined"
            class="rp-card__score"
          >
            <span class="rp-card__score-value" dir="ltr">
              {{ result.participant1Score ?? '—' }} : {{ result.participant2Score ?? '—' }}
            </span>
          </div>

          <!-- Date -->
          <div class="rp-card__date">{{ formatDate(result.recordedAt) }}</div>
        </li>
      </ul>
    </template>
  </div>
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

const notFound = computed(() => !pending.value && !fetchError.value && !tournament.value);

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
.rp {
  padding: var(--space-6) 0 var(--space-16);
}

/* ── States ──────────────────────────────────────────────────────────────── */
.rp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.rp-state--error .rp-state__text { color: var(--danger-400); }
.rp-state__text { font-size: var(--text-body-size); color: var(--text-muted); margin: 0; }

/* ── Loading skeleton ────────────────────────────────────────────────────── */
.rp-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) 0;
}

.rp-skel-card {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.rp-skel {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: rp-shimmer 1.6s ease-in-out infinite;
}

@keyframes rp-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.rp-skel--winner { flex: 1; height: 18px; }
.rp-skel--score  { height: 22px; width: 64px; flex-shrink: 0; }
.rp-skel--date   { height: 12px; width: 96px; flex-shrink: 0; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.rp-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.rp-title {
  font-family: var(--font-display);
  font-size: var(--text-h3-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--text-h3-tracking);
}

.rp-count {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: var(--weight-semibold);
  color: var(--purple-300);
  background: rgba(124, 58, 237, 0.12);
  border: 1px solid rgba(124, 58, 237, 0.25);
}

/* ── Empty ───────────────────────────────────────────────────────────────── */
.rp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
  color: var(--text-disabled);
}

.rp-empty__text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

/* ── Results list ────────────────────────────────────────────────────────── */
.rp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.rp-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  transition: border-color var(--motion-fast) var(--ease-out);
}

.rp-card:hover {
  border-color: rgba(124, 58, 237, 0.3);
}

.rp-card__winner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.rp-card__winner-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: var(--weight-semibold);
  color: #F59E0B;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.rp-card__winner-name {
  font-size: var(--text-body-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rp-card__score {
  flex-shrink: 0;
}

.rp-card__score-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  background: rgba(124, 58, 237, 0.1);
  border: 1px solid rgba(124, 58, 237, 0.2);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--purple-300);
  letter-spacing: 0.04em;
}

.rp-card__date {
  font-size: 11px;
  color: var(--text-disabled);
  font-family: var(--font-mono);
  flex-shrink: 0;
  text-align: left;
  direction: ltr;
}

@media (max-width: 600px) {
  .rp-card {
    flex-wrap: wrap;
  }

  .rp-card__date {
    width: 100%;
    padding-top: var(--space-2);
    border-top: 1px solid var(--glass-hairline);
  }
}
</style>
