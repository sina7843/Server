<template>
  <div class="sp">

    <!-- Loading skeleton -->
    <div v-if="pending" class="sp-loading" aria-busy="true">
      <div class="sp-skel-header"></div>
      <div class="sp-table-wrap">
        <div v-for="i in 5" :key="i" class="sp-skel-row">
          <div class="sp-skel sp-skel--rank"></div>
          <div class="sp-skel sp-skel--name"></div>
          <div class="sp-skel sp-skel--num"></div>
          <div class="sp-skel sp-skel--num"></div>
          <div class="sp-skel sp-skel--num"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="sp-state sp-state--error" role="alert">
      <p class="sp-state__text">خطا در بارگذاری جدول رده‌بندی.</p>
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="sp-state" role="alert">
      <p class="sp-state__text">تورنمنت یافت نشد.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <!-- Content -->
    <template v-else-if="tournament">
      <!-- Header -->
      <div class="sp-header">
        <h2 class="sp-title">جدول رده‌بندی</h2>
      </div>

      <!-- Unavailable for manual format -->
      <div v-if="standingsUnavailable" class="sp-unavail" role="status">
        <p class="sp-unavail__text">جدول رده‌بندی برای این فرمت تورنمنت در دسترس نیست.</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!standingRows.length" class="sp-empty" role="status">
        <div class="sp-empty__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
        </div>
        <p class="sp-empty__text">هنوز رده‌بندی ثبت نشده است.</p>
      </div>

      <!-- Standings table -->
      <div v-else class="sp-table-wrap">
        <table class="sp-table" aria-label="جدول رده‌بندی">
          <thead>
            <tr class="sp-thead-row">
              <th class="sp-th sp-th--rank">رتبه</th>
              <th class="sp-th sp-th--name">بازیکن / تیم</th>
              <th class="sp-th sp-th--num">برد</th>
              <th class="sp-th sp-th--num">باخت</th>
              <th class="sp-th sp-th--pts">امتیاز</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in standingRows"
              :key="row.participantId"
              class="sp-tr"
              :class="{
                'sp-tr--gold': row.rank === 1,
                'sp-tr--silver': row.rank === 2,
                'sp-tr--bronze': row.rank === 3,
              }"
            >
              <td class="sp-td sp-td--rank">
                <span class="sp-rank-badge">{{ row.rank }}</span>
              </td>
              <td class="sp-td sp-td--name">{{ row.displayName }}</td>
              <td class="sp-td sp-td--num sp-td--wins">{{ row.wins }}</td>
              <td class="sp-td sp-td--num sp-td--losses">{{ row.losses }}</td>
              <td class="sp-td sp-td--pts">{{ row.points }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
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
.sp {
  padding: var(--space-6) 0 var(--space-16);
}

/* ── States ──────────────────────────────────────────────────────────────── */
.sp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.sp-state--error .sp-state__text { color: var(--danger-400); }
.sp-state__text { font-size: var(--text-body-size); color: var(--text-muted); margin: 0; }

/* ── Loading skeleton ────────────────────────────────────────────────────── */
.sp-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4) 0;
}

.sp-skel-header {
  height: 28px;
  width: 160px;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: sp-shimmer 1.6s ease-in-out infinite;
}

.sp-skel-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 12px var(--space-4);
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.sp-skel {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: sp-shimmer 1.6s ease-in-out infinite;
}

@keyframes sp-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.sp-skel--rank { height: 26px; width: 26px; border-radius: 50%; flex-shrink: 0; }
.sp-skel--name { flex: 1; height: 14px; }
.sp-skel--num  { height: 14px; width: 28px; flex-shrink: 0; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.sp-header {
  margin-bottom: var(--space-5);
}

.sp-title {
  font-family: var(--font-display);
  font-size: var(--text-h3-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--text-h3-tracking);
}

/* ── Unavailable / Empty ─────────────────────────────────────────────────── */
.sp-unavail,
.sp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
  color: var(--text-disabled);
}

.sp-unavail__text,
.sp-empty__text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

/* ── Table wrapper ───────────────────────────────────────────────────────── */
.sp-table-wrap {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  overflow-x: auto;
}

/* ── Table ───────────────────────────────────────────────────────────────── */
.sp-table {
  width: 100%;
  border-collapse: collapse;
}

.sp-thead-row {
  border-bottom: 1px solid var(--glass-hairline);
}

.sp-th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: var(--weight-semibold);
  color: var(--text-muted);
  text-align: right;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.sp-th--num,
.sp-th--pts {
  text-align: center;
}

.sp-tr {
  border-bottom: 1px solid var(--glass-hairline);
  transition: background var(--motion-fast) var(--ease-out);
}

.sp-tr:last-child {
  border-bottom: none;
}

.sp-tr:hover {
  background: var(--hover-overlay);
}

/* Top 3 row highlights */
.sp-tr--gold   { background: rgba(245, 158, 11, 0.05); }
.sp-tr--silver { background: rgba(156, 163, 175, 0.05); }
.sp-tr--bronze { background: rgba(180, 83, 9, 0.05); }

.sp-tr--gold:hover   { background: rgba(245, 158, 11, 0.09); }
.sp-tr--silver:hover { background: rgba(156, 163, 175, 0.09); }
.sp-tr--bronze:hover { background: rgba(180, 83, 9, 0.09); }

.sp-td {
  padding: 14px 16px;
  font-size: var(--text-body-sm-size);
  color: var(--text-secondary);
}

.sp-td--name {
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.sp-td--num {
  text-align: center;
  font-family: var(--font-mono);
  font-size: 13px;
}

.sp-td--wins { color: #4ADE80; }
.sp-td--losses { color: var(--text-muted); }

.sp-td--pts {
  text-align: center;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Rank badge */
.sp-rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}

.sp-tr--gold .sp-rank-badge {
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.sp-tr--silver .sp-rank-badge {
  background: rgba(156, 163, 175, 0.12);
  color: #9CA3AF;
  border: 1px solid rgba(156, 163, 175, 0.25);
}

.sp-tr--bronze .sp-rank-badge {
  background: rgba(180, 83, 9, 0.12);
  color: #CD7C3A;
  border: 1px solid rgba(180, 83, 9, 0.25);
}

.sp-tr:not(.sp-tr--gold):not(.sp-tr--silver):not(.sp-tr--bronze) .sp-rank-badge {
  color: var(--text-muted);
}
</style>
