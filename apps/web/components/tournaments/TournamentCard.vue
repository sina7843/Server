<template>
  <article class="tournament-card dr-card" :class="{ 'tournament-card--cancelled': isCancelled }">
    <div class="tournament-card__meta">
      <span
        class="tournament-card__status-badge"
        :class="statusBadgeClass"
        aria-label="`وضعیت: ${statusLabel}`"
        >{{ statusLabel }}</span
      >
      <span class="tournament-card__format">{{ formatLabel }}</span>
    </div>

    <h3 class="tournament-card__title">{{ tournament.title }}</h3>

    <div v-if="tournament.startsAt" class="tournament-card__starts-at">
      شروع: {{ formattedStartsAt }}
    </div>

    <div class="tournament-card__footer">
      <span class="tournament-card__capacity">{{ tournament.capacity }} نفر</span>
      <NuxtLink
        v-if="!isCancelled"
        :to="`/tournaments/${tournament.slug}`"
        class="dr-btn dr-btn-primary tournament-card__cta"
      >
        مشاهده
      </NuxtLink>
      <span v-else class="tournament-card__cancelled-note">لغو شده</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { TournamentListItemDto, TournamentStatus, TournamentFormat } from '@dragon/types';

const props = defineProps<{
  tournament: TournamentListItemDto;
}>();

const isCancelled = computed(() => props.tournament.status === 'cancelled');

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

const statusLabel = computed(
  () => STATUS_LABELS[props.tournament.status] ?? props.tournament.status,
);

const formatLabel = computed(
  () => FORMAT_LABELS[props.tournament.format] ?? props.tournament.format,
);

const statusBadgeClass = computed(() => {
  const s = props.tournament.status;
  if (s === 'in_progress') return 'dr-badge dr-badge-live';
  if (s === 'registration_open') return 'dr-badge dr-badge-success';
  if (s === 'cancelled') return 'dr-badge dr-badge-danger';
  return 'dr-badge';
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
.tournament-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
}

.tournament-card--cancelled {
  opacity: 0.7;
}

.tournament-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.tournament-card__format {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-sans-en);
}

.tournament-card__title {
  font-size: var(--text-h4-size);
  font-weight: var(--weight-semibold);
  margin: 0;
  color: var(--text-primary);
}

.tournament-card--cancelled .tournament-card__title {
  color: var(--text-muted);
  text-decoration: line-through;
}

.tournament-card__starts-at {
  font-size: var(--text-caption-size);
  color: var(--text-secondary);
}

.tournament-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: auto;
}

.tournament-card__capacity {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}

.tournament-card__cancelled-note {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-style: italic;
}
</style>
