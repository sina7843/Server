<template>
  <div class="page">
    <div class="page-header">
      <NuxtLink :to="`/tournaments/${tournamentId}`" class="back-link">← جزئیات تورنمنت</NuxtLink>
      <h1 class="page-title">نمای درختی مسابقات</h1>
    </div>

    <UnauthorizedState v-if="!accessToken" />

    <ForbiddenState v-else-if="!hasPermission(Permissions.TOURNAMENT_MATCH_READ)" />

    <template v-else>
      <LoadingState v-if="bracketLoading" />
      <ErrorState v-else-if="bracketError" :message="bracketError" @retry="load" />

      <template v-else-if="bracket">
        <div class="meta-row">
          <span class="meta-label">فرمت:</span>
          <span class="meta-value">{{ bracket.format }}</span>
          <span class="meta-sep">·</span>
          <span class="meta-label">تولید شده در:</span>
          <span class="meta-value">{{ formatDate(bracket.generatedAt) }}</span>
        </div>

        <EmptyState v-if="bracket.rounds.length === 0" label="نمای درختی هنوز در دسترس نیست." />

        <div v-else class="rounds">
          <div v-for="roundData in bracket.rounds" :key="roundData.round" class="round-column">
            <div class="round-header">{{ roundData.label }}</div>
            <div class="match-list">
              <div
                v-for="match in roundData.matches"
                :key="match.matchId"
                class="match-card"
                :class="`match-card--${match.status}`"
              >
                <div class="match-number">مسابقه {{ match.matchNumber }}</div>
                <div
                  class="match-participant"
                  :class="{
                    'match-participant--winner':
                      match.winnerId === match.participant1?.participantId,
                  }"
                >
                  <span class="seed" v-if="match.participant1">{{ match.participant1.seed }}</span>
                  <span class="name">{{ match.participant1?.displayName ?? '—' }}</span>
                </div>
                <div class="match-vs">در برابر</div>
                <div
                  class="match-participant"
                  :class="{
                    'match-participant--winner':
                      match.winnerId === match.participant2?.participantId,
                  }"
                >
                  <span class="seed" v-if="match.participant2">{{ match.participant2.seed }}</span>
                  <span class="name">{{ match.participant2?.displayName ?? '—' }}</span>
                </div>
                <div class="match-status">
                  <MatchStatusBadge :status="match.status as TournamentMatchStatus" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <EmptyState v-else label="نمای درختی هنوز در دسترس نیست." />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { TournamentMatchStatus } from '@dragon/types';
import { DragonPermissions as Permissions } from '@dragon/sdk';

definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth-required', 'admin-permission-required'],
  requiredPermission: Permissions.TOURNAMENT_MATCH_READ,
});
useHead({ title: 'نمای درختی مسابقات — Dragon Admin' });

const route = useRoute();
const tournamentId = String(route.params['id']);

const { accessToken } = useAdminAuthState();
const { hasPermission } = useAdminPermissions();
const { bracket, bracketLoading, bracketError, loadBracket } = useAdminTournamentBracket();

async function load() {
  await loadBracket(tournamentId);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  if (hasPermission(Permissions.TOURNAMENT_MATCH_READ)) {
    void load();
  }
});
</script>

<style scoped>
.page {
  max-width: 1200px;
}

.page-header {
  margin-block-end: 1.25rem;
}

.back-link {
  font-size: 0.85rem;
  color: #3b82f6;
  text-decoration: none;
  display: inline-block;
  margin-block-end: 0.4rem;
}

.back-link:hover {
  text-decoration: underline;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #64748b;
  margin-block-end: 1.25rem;
  flex-wrap: wrap;
}

.meta-label {
  font-weight: 600;
}

.meta-sep {
  color: #cbd5e1;
}

.rounds {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding-block-end: 1rem;
  align-items: flex-start;
}

.round-column {
  flex: 0 0 220px;
  min-width: 220px;
}

.round-header {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6366f1;
  padding: 0.35rem 0.6rem;
  background: #f0f0ff;
  border-radius: 0.375rem;
  margin-block-end: 0.75rem;
  text-align: center;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.match-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-size: 0.8rem;
}

.match-card--completed {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.match-card--cancelled {
  border-color: #fecaca;
  background: #fff5f5;
  opacity: 0.7;
}

.match-card--in_progress {
  border-color: #ddd6fe;
  background: #faf5ff;
}

.match-number {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-block-end: 0.4rem;
  font-weight: 600;
}

.match-participant {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.35rem;
  border-radius: 0.25rem;
  color: #374151;
}

.match-participant--winner {
  background: #dcfce7;
  color: #166534;
  font-weight: 700;
}

.seed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  background: #e2e8f0;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  flex-shrink: 0;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-vs {
  font-size: 0.65rem;
  color: #94a3b8;
  text-align: center;
  margin-block: 0.15rem;
}

.match-status {
  margin-block-start: 0.4rem;
  text-align: center;
}
</style>
