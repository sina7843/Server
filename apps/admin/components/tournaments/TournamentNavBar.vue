<template>
  <div class="t-nav">
    <!-- Context strip -->
    <div class="t-context">
      <NuxtLink to="/tournaments" class="t-back">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        تورنمنت‌ها
      </NuxtLink>
      <span class="t-sep" aria-hidden="true" />
      <template v-if="tournament">
        <span class="t-name">{{ tournament.title }}</span>
        <TournamentStatusBadge :status="tournament.status" />
        <TournamentFormatBadge :format="tournament.format" />
        <span v-if="tournament.capacity" class="t-meta">ظرفیت: {{ tournament.capacity }}</span>
        <span v-if="tournament.startsAt" class="t-meta">
          شروع: {{ formatDate(tournament.startsAt) }}
        </span>
      </template>
      <span v-else-if="loading" class="t-ghost">در حال بارگذاری…</span>
    </div>

    <!-- Tab bar -->
    <nav class="t-tabs" aria-label="بخش‌های تورنمنت">
      <NuxtLink
        v-for="tab in visibleTabs"
        :key="tab.key"
        :to="tab.to"
        class="t-tab"
        :class="{ 't-tab--active': activeKey === tab.key }"
      >
        {{ tab.label }}
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { DragonPermissions as Permissions } from '@dragon/sdk';

const route = useRoute();
const id = computed(() => String(route.params['id']));
const { hasPermission } = useAdminPermissions();
const { tournament, tournamentLoading: loading, loadTournament } = useAdminTournaments();

const canReadRegistrations = computed(() =>
  hasPermission(Permissions.TOURNAMENT_REGISTRATION_READ),
);
const canReadParticipants = computed(() =>
  hasPermission(Permissions.TOURNAMENT_PARTICIPANT_READ),
);
const canReadMatches = computed(() => hasPermission(Permissions.TOURNAMENT_MATCH_READ));

const allTabs = computed(() => [
  { key: 'overview', label: 'خلاصه', to: `/tournaments/${id.value}`, visible: true },
  {
    key: 'registrations',
    label: 'ثبت‌نام‌ها',
    to: `/tournaments/${id.value}/registrations`,
    visible: canReadRegistrations.value,
  },
  {
    key: 'participants',
    label: 'شرکت‌کنندگان',
    to: `/tournaments/${id.value}/participants`,
    visible: canReadParticipants.value,
  },
  {
    key: 'matches',
    label: 'مسابقات',
    to: `/tournaments/${id.value}/matches`,
    visible: canReadMatches.value,
  },
  {
    key: 'results',
    label: 'نتایج',
    to: `/tournaments/${id.value}/results`,
    visible: canReadMatches.value,
  },
  {
    key: 'standings',
    label: 'جدول امتیازات',
    to: `/tournaments/${id.value}/standings`,
    visible: canReadMatches.value,
  },
  {
    key: 'bracket',
    label: 'نمای درختی',
    to: `/tournaments/${id.value}/bracket`,
    visible: canReadMatches.value,
  },
]);

const visibleTabs = computed(() => allTabs.value.filter((t) => t.visible));

const activeKey = computed(() => {
  const path = route.path.replace(/\/$/, '');
  const idVal = id.value;
  if (path === `/tournaments/${idVal}`) return 'overview';
  return path.split('/').filter(Boolean).pop() ?? 'overview';
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

onMounted(async () => {
  const idVal = id.value;
  if (!tournament.value || tournament.value.id !== idVal) {
    await loadTournament(idVal);
  }
});
</script>

<style scoped>
.t-nav {
  margin-block-end: 24px;
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  overflow: hidden;
}

/* ── Context strip ── */
.t-context {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 18px 10px;
  border-bottom: 1px solid var(--glass-hairline);
  flex-wrap: wrap;
  min-height: 40px;
}

.t-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color var(--motion-fast);
  flex-shrink: 0;
}

.t-back:hover {
  color: var(--text-secondary);
}

.t-sep {
  width: 1px;
  height: 13px;
  background: var(--border-default);
  flex-shrink: 0;
}

.t-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.t-meta {
  font-size: 12px;
  color: var(--text-muted);
}

.t-ghost {
  font-size: 12.5px;
  color: var(--text-disabled);
  font-style: italic;
}

/* ── Tab bar ── */
.t-tabs {
  display: flex;
  padding: 0 8px;
  overflow-x: auto;
  scrollbar-width: none;
  gap: 0;
}

.t-tabs::-webkit-scrollbar {
  display: none;
}

.t-tab {
  display: inline-flex;
  align-items: center;
  height: 40px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    color var(--motion-fast),
    border-color var(--motion-fast);
}

.t-tab:hover {
  color: var(--text-secondary);
}

.t-tab--active {
  color: var(--purple-300);
  border-bottom-color: var(--purple-500);
  font-weight: 600;
}
</style>
