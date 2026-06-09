<template>
  <div class="page">
    <TournamentNavBar />

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

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  margin-block-end: 1.25rem;
  flex-wrap: wrap;
}

.meta-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.meta-value {
  color: var(--text-muted);
}

.meta-sep {
  color: var(--border-strong);
}

.rounds {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-block-end: 1rem;
  align-items: flex-start;
}

.round-column {
  flex: 0 0 210px;
  min-width: 210px;
}

.round-header {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--purple-300);
  padding: 5px 10px;
  background: rgba(109, 40, 217, 0.1);
  border: 1px solid rgba(109, 40, 217, 0.2);
  border-radius: var(--radius-xs);
  margin-block-end: 10px;
  text-align: center;
  font-family: var(--font-sans-en);
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.match-card {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 12px;
  font-size: 12.5px;
  backdrop-filter: blur(12px);
  transition: border-color var(--motion-fast);
}

.match-card--completed {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.06);
}

.match-card--cancelled {
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.05);
  opacity: 0.7;
}

.match-card--in_progress {
  border-color: rgba(109, 40, 217, 0.3);
  background: rgba(109, 40, 217, 0.06);
}

.match-number {
  font-size: 10px;
  color: var(--text-disabled);
  margin-block-end: 6px;
  font-weight: 600;
  font-family: var(--font-mono);
}

.match-participant {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 6px;
  border-radius: var(--radius-xs);
  color: var(--text-secondary);
}

.match-participant--winner {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-400);
  font-weight: 700;
}

.seed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--hover-overlay);
  border: 1px solid var(--border-default);
  border-radius: 50%;
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-vs {
  font-size: 10px;
  color: var(--text-disabled);
  text-align: center;
  margin-block: 2px;
  font-style: italic;
}

.match-status {
  margin-block-start: 6px;
  text-align: center;
}
</style>
