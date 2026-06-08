<template>
  <section class="esports-tournaments" aria-label="تورنومنت‌ها">
    <div class="esports-tournaments__header">
      <div class="esports-tournaments__title-group">
        <span class="dr-label font-en">Tournaments</span>
        <h2 class="esports-tournaments__heading">تورنومنت‌ها</h2>
      </div>
      <NuxtLink to="/tournaments" class="esports-tournaments__all-link">
        همه تورنومنت‌ها
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </NuxtLink>
    </div>

    <div v-if="active.length > 0" class="esports-tournaments__group">
      <h3 class="esports-tournaments__sub-heading">
        <span class="dr-badge dr-badge-live">زنده</span>
        در حال برگزاری
      </h3>
      <ul class="esports-tournaments__list" role="list">
        <li v-for="t in active" :key="t.id">
          <NuxtLink :to="`/tournaments/${t.slug}`" class="tournament-card tournament-card--live">
            <div class="tournament-card__glow" aria-hidden="true" />
            <div class="tournament-card__body">
              <span class="tournament-card__name">{{ t.title }}</span>
              <span class="tournament-card__format font-en">{{ t.format }}</span>
            </div>
            <svg
              class="tournament-card__arrow"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div v-if="upcoming.length > 0" class="esports-tournaments__group">
      <h3 class="esports-tournaments__sub-heading">
        <span class="dr-badge dr-badge-soon">به زودی</span>
        آینده
      </h3>
      <ul class="esports-tournaments__list" role="list">
        <li v-for="t in upcoming" :key="t.id">
          <NuxtLink :to="`/tournaments/${t.slug}`" class="tournament-card tournament-card--upcoming">
            <div class="tournament-card__body">
              <span class="tournament-card__name">{{ t.title }}</span>
              <span class="tournament-card__format font-en">{{ t.format }}</span>
            </div>
            <svg
              class="tournament-card__arrow"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TournamentListItemDto } from '@dragon/types';

defineProps<{
  active: readonly TournamentListItemDto[];
  upcoming: readonly TournamentListItemDto[];
}>();
</script>

<style scoped>
.esports-tournaments {
  margin-bottom: var(--space-12);
}

/* ── Section header ── */
.esports-tournaments__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
}

.esports-tournaments__title-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding-right: var(--space-4);
  border-right: 3px solid rgba(239, 68, 68, 0.6);
}

.esports-tournaments__heading {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  margin: 0;
  color: var(--text-primary);
}

.esports-tournaments__all-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  flex-shrink: 0;
  transition: color var(--motion-fast);
}

.esports-tournaments__all-link:hover {
  color: var(--purple-300);
}

.esports-tournaments__group {
  margin-bottom: var(--space-8);
}

.esports-tournaments__sub-heading {
  font-size: var(--text-h4-size);
  font-weight: var(--weight-semibold);
  margin: 0 0 var(--space-4) 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-primary);
}

.esports-tournaments__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

/* ── Tournament card ── */
.tournament-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  text-decoration: none;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition:
    border-color var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-out);
}

.tournament-card:hover {
  border-color: var(--glass-border-strong);
  box-shadow:
    var(--shadow-sm),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.tournament-card--live {
  border-color: rgba(239, 68, 68, 0.25);
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.06),
    var(--surface-card)
  );
}

.tournament-card--live:hover {
  border-color: rgba(239, 68, 68, 0.45);
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.15);
}

.tournament-card--upcoming {
  border-color: rgba(245, 158, 11, 0.2);
}

.tournament-card--upcoming:hover {
  border-color: rgba(245, 158, 11, 0.4);
}

.tournament-card__glow {
  position: absolute;
  top: 50%;
  right: -20px;
  transform: translateY(-50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.35) 0%, transparent 70%);
  pointer-events: none;
  animation: dr-pulse 2s ease-in-out infinite;
}

.tournament-card__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-width: 0;
}

.tournament-card__name {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tournament-card__format {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  flex-shrink: 0;
}

.tournament-card__arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition:
    color var(--motion-fast),
    transform var(--motion-fast) var(--ease-spring);
}

.tournament-card:hover .tournament-card__arrow {
  color: var(--purple-300);
  transform: translateX(-4px);
}

@media (min-width: 640px) {
  .esports-tournaments__list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
