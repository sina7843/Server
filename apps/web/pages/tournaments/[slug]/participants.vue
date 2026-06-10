<template>
  <div class="pp">

    <!-- Loading skeleton -->
    <div v-if="pending" class="pp-loading" aria-busy="true">
      <div v-for="i in 5" :key="i" class="pp-skel-row">
        <div class="pp-skel pp-skel--avatar"></div>
        <div class="pp-skel-text">
          <div class="pp-skel pp-skel--name"></div>
          <div class="pp-skel pp-skel--team"></div>
        </div>
        <div class="pp-skel pp-skel--badge"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="fetchError" class="pp-state pp-state--error" role="alert">
      <p class="pp-state__text">خطا در بارگذاری شرکت‌کنندگان.</p>
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="pp-state" role="alert">
      <p class="pp-state__text">تورنمنت یافت نشد.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <!-- Content -->
    <template v-else-if="tournament">
      <!-- Header -->
      <div class="pp-header">
        <h2 class="pp-title">شرکت‌کنندگان</h2>
        <span v-if="total" class="pp-count">{{ total }} نفر</span>
      </div>

      <!-- Empty -->
      <div v-if="!participants.length" class="pp-empty" role="status">
        <div class="pp-empty__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
        <p class="pp-empty__text">هنوز شرکت‌کننده‌ای ثبت نشده است.</p>
      </div>

      <!-- List -->
      <ul v-else class="pp-list" aria-label="لیست شرکت‌کنندگان">
        <li
          v-for="(participant, index) in participants"
          :key="participant.id"
          class="pp-item"
        >
          <!-- Rank -->
          <span class="pp-item__rank">{{ index + 1 }}</span>

          <!-- Avatar -->
          <div class="pp-item__avatar" aria-hidden="true">
            {{ participant.displayName.charAt(0) }}
          </div>

          <!-- Info -->
          <div class="pp-item__info">
            <span class="pp-item__name">{{ participant.displayName }}</span>
            <span v-if="participant.teamName" class="pp-item__team">{{ participant.teamName }}</span>
          </div>

          <!-- Meta -->
          <div class="pp-item__meta">
            <span v-if="participant.seed != null" class="pp-item__seed">#{{ participant.seed }}</span>
            <span
              class="dr-badge"
              :class="participantStatusClass(participant.status)"
            >
              {{ participantStatusLabel(participant.status) }}
            </span>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  PublicTournamentDto,
  TournamentStatus,
  TournamentParticipantPublicDto,
  ParticipantStatus,
} from '@dragon/types';

const route = useRoute();
const slug = route.params.slug as string;
const detail = useTournamentDetail();
const participantsApi = useTournamentParticipants();
const runtimeConfig = useRuntimeConfig();

// ─── Fetch tournament + participants (SSR + CSR) ──────────────────────────────

const {
  data,
  pending,
  error: fetchError,
} = await useAsyncData(`tournament-participants-${slug}`, async () => {
  try {
    const tournament = await detail.getBySlug(slug);
    const participantsResult = await participantsApi.getParticipants(slug);
    return { tournament, participants: participantsResult };
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 404) return null;
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const tournament = computed<PublicTournamentDto | null>(() => data.value?.tournament ?? null);
const participants = computed<readonly TournamentParticipantPublicDto[]>(
  () => data.value?.participants?.items ?? [],
);
const total = computed<number>(() => data.value?.participants?.total ?? 0);

const notFound = computed(() => !pending.value && !fetchError.value && !tournament.value);

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

const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  active: 'فعال',
  withdrawn: 'انصراف داده',
  disqualified: 'محروم',
  removed: 'حذف شده',
};

function participantStatusLabel(status: ParticipantStatus): string {
  return PARTICIPANT_STATUS_LABELS[status] ?? status;
}

function participantStatusClass(status: ParticipantStatus): string {
  if (status === 'active') return 'dr-badge-success';
  if (status === 'disqualified' || status === 'removed') return 'dr-badge-danger';
  return '';
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

    const title = `شرکت‌کنندگان ${t.title} — ${siteName}`;
    const description = `لیست شرکت‌کنندگان تورنمنت ${t.title}.`;

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
.pp {
  padding: var(--space-6) 0 var(--space-16);
}

/* ── States ──────────────────────────────────────────────────────────────── */
.pp-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.pp-state--error .pp-state__text {
  color: var(--danger-400);
}

.pp-state__text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

/* ── Loading skeleton ────────────────────────────────────────────────────── */
.pp-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) 0;
}

.pp-skel-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.pp-skel-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pp-skel {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: pp-shimmer 1.6s ease-in-out infinite;
}

@keyframes pp-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.pp-skel--avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
.pp-skel--name  { height: 14px; width: 55%; }
.pp-skel--team  { height: 11px; width: 35%; }
.pp-skel--badge { height: 22px; width: 52px; border-radius: var(--radius-pill); flex-shrink: 0; }

/* ── Header ──────────────────────────────────────────────────────────────── */
.pp-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.pp-title {
  font-family: var(--font-display);
  font-size: var(--text-h3-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--text-h3-tracking);
}

.pp-count {
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
.pp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.pp-empty__icon {
  color: var(--text-disabled);
}

.pp-empty__text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

/* ── List ────────────────────────────────────────────────────────────────── */
.pp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.pp-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  transition: border-color var(--motion-fast) var(--ease-out);
}

.pp-item:hover {
  border-color: rgba(124, 58, 237, 0.3);
}

.pp-item__rank {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-disabled);
  min-width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.pp-item__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(109, 40, 217, 0.25);
}

.pp-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.pp-item__name {
  font-size: var(--text-body-sm-size);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pp-item__team {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}

.pp-item__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.pp-item__seed {
  font-family: var(--font-mono);
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}
</style>
