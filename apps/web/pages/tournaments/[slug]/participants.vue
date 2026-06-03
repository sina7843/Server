<template>
  <main class="participants-page">
    <div v-if="pending" class="participants-page__state" role="status">
      <span class="participants-page__state-text">در حال بارگذاری...</span>
    </div>

    <div
      v-else-if="fetchError"
      class="participants-page__state participants-page__state--error"
      role="alert"
    >
      <p class="participants-page__state-text">خطا در بارگذاری شرکت‌کنندگان.</p>
    </div>

    <div
      v-else-if="notFound"
      class="participants-page__state participants-page__state--not-found"
      role="alert"
    >
      <h1 class="participants-page__not-found-title">تورنمنت یافت نشد.</h1>
      <p class="participants-page__not-found-body">
        این تورنمنت وجود ندارد یا در دسترس عمومی نیست.
      </p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <template v-else-if="tournament">
      <!-- Compact tournament context -->
      <div class="participants-page__context">
        <NuxtLink :to="`/tournaments/${tournament.slug}`" class="participants-page__back-link">
          ← {{ tournament.title }}
        </NuxtLink>
        <span class="participants-page__context-status" :class="statusBadgeClass">
          {{ statusLabel }}
        </span>
        <nav class="participants-page__nav" aria-label="صفحات تورنمنت">
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/participants`"
            class="participants-page__nav-link participants-page__nav-link--active"
          >
            شرکت‌کنندگان
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/matches`"
            class="participants-page__nav-link"
          >
            مسابقات
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/results`"
            class="participants-page__nav-link"
          >
            نتایج
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/standings`"
            class="participants-page__nav-link"
          >
            جدول رده‌بندی
          </NuxtLink>
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/bracket`"
            class="participants-page__nav-link"
          >
            براکت
          </NuxtLink>
        </nav>
      </div>

      <h1 class="participants-page__title">شرکت‌کنندگان</h1>

      <!-- Empty state -->
      <div v-if="!participants.length" class="participants-page__empty" role="status">
        <p class="participants-page__empty-text">هنوز شرکت‌کننده‌ای ثبت نشده است.</p>
      </div>

      <!-- Participants list -->
      <section v-else class="participants-page__list" aria-label="لیست شرکت‌کنندگان">
        <p class="participants-page__count">{{ total }} شرکت‌کننده</p>
        <ul class="participants-page__items">
          <li
            v-for="participant in participants"
            :key="participant.id"
            class="participants-page__item"
          >
            <div class="participants-page__item-info">
              <span class="participants-page__item-name">{{ participant.displayName }}</span>
              <span v-if="participant.teamName" class="participants-page__item-team">
                {{ participant.teamName }}
              </span>
            </div>
            <div class="participants-page__item-meta">
              <span v-if="participant.seed != null" class="participants-page__item-seed">
                #{{ participant.seed }}
              </span>
              <span
                class="participants-page__item-status dr-badge"
                :class="participantStatusClass(participant.status)"
              >
                {{ participantStatusLabel(participant.status) }}
              </span>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </main>
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
.participants-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.participants-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.participants-page__state-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
}

.participants-page__not-found-title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0;
  color: var(--text-primary);
}

.participants-page__not-found-body {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.participants-page__context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.participants-page__back-link {
  font-size: var(--text-body-size);
  color: var(--text-link);
  text-decoration: none;
}

.participants-page__back-link:hover {
  text-decoration: underline;
}

.participants-page__nav {
  display: flex;
  gap: var(--space-2);
  margin-right: auto;
}

.participants-page__nav-link {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  text-decoration: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
}

.participants-page__nav-link:hover {
  color: var(--text-primary);
}

.participants-page__nav-link--active {
  color: var(--text-primary);
  background: var(--surface-card);
  font-weight: var(--weight-semibold);
}

.participants-page__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0 0 var(--space-6) 0;
  color: var(--text-primary);
}

.participants-page__empty {
  padding: var(--space-12) 0;
  text-align: center;
}

.participants-page__empty-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
}

.participants-page__count {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  margin: 0 0 var(--space-4) 0;
}

.participants-page__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.participants-page__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}

.participants-page__item-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.participants-page__item-name {
  font-size: var(--text-body-size);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.participants-page__item-team {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
}

.participants-page__item-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.participants-page__item-seed {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-sans-en);
}

.participants-page__item-status {
  font-size: var(--text-caption-size);
}
</style>
