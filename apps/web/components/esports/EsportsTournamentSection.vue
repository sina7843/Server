<template>
  <section class="esports-tournaments" aria-label="تورنومنت‌ها">
    <div class="esports-tournaments__header">
      <span class="dr-label">Tournaments</span>
      <h2 class="esports-tournaments__heading">تورنومنت‌ها</h2>
    </div>

    <div v-if="active.length > 0" class="esports-tournaments__group">
      <h3 class="esports-tournaments__sub-heading">
        <span class="dr-badge dr-badge-live">فعال</span>
        در حال برگزاری
      </h3>
      <ul class="esports-tournaments__list" role="list">
        <li v-for="t in active" :key="t.id" class="dr-card esports-tournaments__item">
          <span class="esports-tournaments__name">{{ t.title }}</span>
          <span class="esports-tournaments__format">{{ t.format }}</span>
        </li>
      </ul>
    </div>

    <div v-if="upcoming.length > 0" class="esports-tournaments__group">
      <h3 class="esports-tournaments__sub-heading">آینده</h3>
      <ul class="esports-tournaments__list" role="list">
        <li v-for="t in upcoming" :key="t.id" class="dr-card esports-tournaments__item">
          <span class="esports-tournaments__name">{{ t.title }}</span>
          <span class="esports-tournaments__format">{{ t.format }}</span>
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

.esports-tournaments__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-6);
}

.esports-tournaments__heading {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h2-tracking);
  margin: 0;
  color: var(--text-primary);
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

.esports-tournaments__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
}

.esports-tournaments__name {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.esports-tournaments__format {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-sans-en);
}

@media (min-width: 640px) {
  .esports-tournaments__list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
