<template>
  <article class="tc" :class="{ 'tc--cancelled': isCancelled }">
    <!-- Cover banner -->
    <div class="tc__cover" :style="coverStyle">
      <div class="tc__cover-noise" />

      <!-- Cancelled ribbon -->
      <div v-if="isCancelled" class="tc__cancelled-ribbon" aria-label="لغو شده">
        <span>لغو شده</span>
      </div>

      <!-- Live pulse for in-progress -->
      <div v-if="isLive" class="tc__live-dot">
        <span class="tc__live-pulse" />
        <span class="tc__live-label">LIVE</span>
      </div>

      <!-- Format pill -->
      <span class="tc__format-pill">{{ formatLabel }}</span>
    </div>

    <!-- Body -->
    <div class="tc__body">
      <div class="tc__status-row">
        <span class="tc__status-badge" :class="statusBadgeClass">{{ statusLabel }}</span>
      </div>

      <h3 class="tc__title">{{ tournament.title }}</h3>

      <div class="tc__meta">
        <!-- Capacity -->
        <span class="tc__meta-item">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Z"/>
          </svg>
          {{ tournament.capacity }} نفر
        </span>

        <!-- Date -->
        <span v-if="tournament.startsAt" class="tc__meta-item">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Z"/>
            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5ZM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1Z"/>
          </svg>
          {{ formattedStartsAt }}
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div class="tc__footer">
      <template v-if="!isCancelled">
        <NuxtLink :to="`/tournaments/${tournament.slug}`" class="tc__cta">
          مشاهده تورنمنت
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8Z"/>
          </svg>
        </NuxtLink>
      </template>
      <template v-else>
        <div class="tc__cancelled-footer">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14Zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16Z"/>
            <path d="M11.354 4.646a.5.5 0 0 0-.708 0L8 7.293 5.354 4.646a.5.5 0 0 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0 0-.708Z"/>
          </svg>
          این تورنمنت لغو شد
        </div>
      </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { TournamentListItemDto, TournamentStatus, TournamentFormat } from '@dragon/types';

const props = defineProps<{
  tournament: TournamentListItemDto;
}>();

const isCancelled = computed(() => props.tournament.status === 'cancelled');
const isLive = computed(() => props.tournament.status === 'in_progress');

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

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'حذفی',
  round_robin: 'لیگ',
  manual: 'دستی',
};

const statusLabel = computed(() => STATUS_LABELS[props.tournament.status] ?? props.tournament.status);
const formatLabel = computed(() => FORMAT_LABELS[props.tournament.format] ?? props.tournament.format);

const statusBadgeClass = computed(() => {
  const s = props.tournament.status;
  if (s === 'in_progress') return 'tc__status-badge--live';
  if (s === 'registration_open') return 'tc__status-badge--open';
  if (s === 'cancelled') return 'tc__status-badge--cancelled';
  if (s === 'completed') return 'tc__status-badge--completed';
  return '';
});

// Unique gradient per status — fallback pattern uses gameId hash for variety
const STATUS_GRADIENTS: Partial<Record<TournamentStatus, string>> = {
  registration_open: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0d9488 100%)',
  in_progress: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 40%, #dc2626 100%)',
  completed: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
  registration_closed: 'linear-gradient(135deg, #1e1b2e 0%, #312e42 40%, #6d28d9 100%)',
  published: 'linear-gradient(145deg, #2d1b69 0%, #5b21b6 100%)',
  cancelled: 'linear-gradient(135deg, #1c1917 0%, #292524 40%, #44403c 100%)',
  archived: 'linear-gradient(135deg, #1c1917 0%, #292524 40%, #44403c 100%)',
};

function hashGameId(gameId: string): number {
  let h = 0;
  for (let i = 0; i < gameId.length; i++) h = (h * 31 + gameId.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

const FALLBACK_GRADIENTS = [
  'linear-gradient(145deg, #1a1a5e 0%, #4338ca 100%)',
  'linear-gradient(145deg, #0e3a6e 0%, #1d6fa4 100%)',
  'linear-gradient(145deg, #2d0a4e 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #0d2b1d 0%, #1a4731 40%, #059669 100%)',
];

const coverStyle = computed(() => {
  const imageUrl = props.tournament.coverImageUrl ?? props.tournament.gameCoverImageUrl;
  if (imageUrl) {
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  const gradient =
    STATUS_GRADIENTS[props.tournament.status] ??
    FALLBACK_GRADIENTS[hashGameId(props.tournament.gameId) % FALLBACK_GRADIENTS.length];
  return { background: gradient };
});

const formattedStartsAt = computed(() => {
  if (!props.tournament.startsAt) return '';
  return new Date(props.tournament.startsAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});
</script>

<style scoped>
.tc {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-xl, 1rem);
  border: 1px solid var(--glass-border-strong);
  background: var(--surface-card);
  backdrop-filter: blur(12px);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.tc:not(.tc--cancelled):hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px -4px rgba(109, 40, 217, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4);
  border-color: rgba(109, 40, 217, 0.35);
}

/* ── Cover ─────────────────────────────────────────────────────────────────── */

.tc__cover {
  position: relative;
  height: 96px;
  overflow: hidden;
}

.tc__cover-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  opacity: 0.6;
  pointer-events: none;
}

/* Format pill — bottom-end corner */
.tc__format-pill {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-sans-fa);
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.02em;
}

/* Live indicator */
.tc__live-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 20px;
  padding: 3px 8px 3px 5px;
}

.tc__live-pulse {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  animation: live-pulse 1.5s ease infinite;
}

@keyframes live-pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.tc__live-label {
  font-size: 10px;
  font-weight: 700;
  font-family: var(--font-sans-en);
  color: #fca5a5;
  letter-spacing: 0.08em;
}

/* Cancelled ribbon — diagonal overlay */
.tc__cancelled-ribbon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    -45deg,
    rgba(0, 0, 0, 0.55),
    rgba(0, 0, 0, 0.55) 10px,
    rgba(0, 0, 0, 0.38) 10px,
    rgba(0, 0, 0, 0.38) 20px
  );
}

.tc__cancelled-ribbon span {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-sans-fa);
  padding: 4px 16px;
  border-radius: 4px;
  letter-spacing: 0.06em;
}

/* ── Body ──────────────────────────────────────────────────────────────────── */

.tc__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 10px;
  flex: 1;
}

.tc__status-row {
  display: flex;
  align-items: center;
}

.tc__status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-sans-fa);
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.tc__status-badge--open {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.tc__status-badge--live {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.tc__status-badge--completed {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.tc__status-badge--cancelled {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.tc__title {
  margin: 0;
  font-size: var(--text-body-size);
  font-weight: 700;
  font-family: var(--font-sans-fa);
  color: var(--text-primary);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tc--cancelled .tc__title {
  color: var(--text-muted);
}

.tc__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 2px;
}

.tc__meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-sans-fa);
}

/* ── Footer ────────────────────────────────────────────────────────────────── */

.tc__footer {
  padding: 10px 16px 14px;
  border-top: 1px solid var(--glass-border);
}

.tc__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 16px;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--brand-gradient);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-sans-fa);
  text-decoration: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tc__cta:hover {
  opacity: 0.88;
  transform: scale(0.985);
}

.tc__cancelled-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  font-family: var(--font-sans-fa);
  padding: 6px 0;
}
</style>
