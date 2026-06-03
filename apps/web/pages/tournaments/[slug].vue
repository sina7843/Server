<template>
  <main class="tournament-detail-page">
    <div v-if="pending" class="tournament-detail-page__state" role="status">
      <span class="tournament-detail-page__state-text">در حال بارگذاری...</span>
    </div>

    <div
      v-else-if="error || !tournament"
      class="tournament-detail-page__state tournament-detail-page__state--not-found"
      role="alert"
    >
      <h1 class="tournament-detail-page__not-found-title">تورنمنت یافت نشد.</h1>
      <p class="tournament-detail-page__not-found-body">
        این تورنمنت وجود ندارد یا در دسترس عمومی نیست.
      </p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary"> بازگشت به تورنمنت‌ها </NuxtLink>
    </div>

    <template v-else>
      <div class="tournament-detail-page__header">
        <div class="tournament-detail-page__meta">
          <span class="tournament-detail-page__status-badge" :class="statusBadgeClass">{{
            statusLabel
          }}</span>
          <span class="tournament-detail-page__format">{{ formatLabel }}</span>
          <span v-if="gameName" class="tournament-detail-page__game">{{ gameName }}</span>
          <span
            v-if="tournament.participantType"
            class="tournament-detail-page__participant-type"
            >{{ participantTypeLabel }}</span
          >
        </div>

        <h1 class="tournament-detail-page__title">{{ tournament.title }}</h1>

        <p v-if="tournament.description" class="tournament-detail-page__description">
          {{ tournament.description }}
        </p>
      </div>

      <section class="tournament-detail-page__info" aria-label="اطلاعات تورنمنت">
        <dl class="tournament-detail-page__fields">
          <div v-if="tournament.capacity" class="tournament-detail-page__field">
            <dt>ظرفیت</dt>
            <dd>{{ tournament.capacity }} نفر</dd>
          </div>
          <div v-if="tournament.registrationOpenAt" class="tournament-detail-page__field">
            <dt>شروع ثبت‌نام</dt>
            <dd>{{ formatDate(tournament.registrationOpenAt) }}</dd>
          </div>
          <div v-if="tournament.registrationCloseAt" class="tournament-detail-page__field">
            <dt>پایان ثبت‌نام</dt>
            <dd>{{ formatDate(tournament.registrationCloseAt) }}</dd>
          </div>
          <div v-if="tournament.startsAt" class="tournament-detail-page__field">
            <dt>شروع رقابت</dt>
            <dd>{{ formatDate(tournament.startsAt) }}</dd>
          </div>
          <div v-if="tournament.endsAt" class="tournament-detail-page__field">
            <dt>پایان رقابت</dt>
            <dd>{{ formatDate(tournament.endsAt) }}</dd>
          </div>
        </dl>
      </section>

      <section
        v-if="tournament.rules"
        class="tournament-detail-page__rules"
        aria-label="قوانین تورنمنت"
      >
        <h2 class="tournament-detail-page__section-title">قوانین</h2>
        <p class="tournament-detail-page__rules-text">{{ tournament.rules }}</p>
      </section>

      <div class="tournament-detail-page__cta">
        <template v-if="ctaState === 'register'">
          <NuxtLink :to="`/tournaments/${tournament.slug}/register`" class="dr-btn dr-btn-primary">
            ثبت‌نام
          </NuxtLink>
        </template>

        <template v-else-if="ctaState === 'view_registration'">
          <NuxtLink
            :to="`/tournaments/${tournament.slug}/my-registration`"
            class="dr-btn dr-btn-secondary"
          >
            مشاهده ثبت‌نام من
          </NuxtLink>
        </template>

        <template v-else-if="ctaState === 'registration_closed'">
          <span class="tournament-detail-page__cta-label tournament-detail-page__cta-label--muted">
            ثبت‌نام بسته است
          </span>
        </template>

        <template v-else-if="ctaState === 'in_progress'">
          <span class="tournament-detail-page__cta-label dr-badge dr-badge-live">
            در حال برگزاری
          </span>
        </template>

        <template v-else-if="ctaState === 'completed'">
          <span class="tournament-detail-page__cta-label tournament-detail-page__cta-label--muted">
            رقابت پایان یافته
          </span>
        </template>

        <template v-else-if="ctaState === 'cancelled'">
          <span
            class="tournament-detail-page__cta-label tournament-detail-page__cta-label--cancelled"
          >
            لغو شده
          </span>
        </template>
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import type {
  PublicTournamentDto,
  TournamentStatus,
  TournamentFormat,
  TournamentParticipantType,
} from '@dragon/types';
import { ApiClientError } from '@dragon/sdk';
import { createGamesDiscoveryApi } from '~/features/tournaments/tournaments-api';

const route = useRoute();
const slug = route.params.slug as string;
const detail = useTournamentDetail();
const registrationApi = useRegistration();
const { hasToken } = useAuthToken();
const runtimeConfig = useRuntimeConfig();

// ─── Fetch tournament (SSR + CSR) ─────────────────────────────────────────────

const { data, pending, error } = await useAsyncData(`tournament-${slug}`, async () => {
  try {
    return await detail.getBySlug(slug);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('404')) return null;
    throw err;
  }
});

const tournament = computed<PublicTournamentDto | null>(() => data.value ?? null);

// ─── Game name (client-side — loaded on mount via public games list) ──────────

const gameName = ref<string | null>(null);

// ─── CTA state (client-side — auth is not available during SSR) ───────────────

type CtaKind =
  | 'register'
  | 'view_registration'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'none';

const ctaState = ref<CtaKind>('none');

async function resolveCtaState() {
  const t = tournament.value;
  if (!t) return;

  if (t.status === 'cancelled') {
    ctaState.value = 'cancelled';
    return;
  }
  if (t.status === 'completed') {
    ctaState.value = 'completed';
    return;
  }
  if (t.status === 'in_progress') {
    ctaState.value = 'in_progress';
    return;
  }
  if (t.status === 'registration_closed') {
    ctaState.value = 'registration_closed';
    return;
  }
  if (t.status === 'registration_open') {
    // Respect the registration window if present — status alone is not sufficient.
    const now = Date.now();
    if (t.registrationOpenAt && now < new Date(t.registrationOpenAt).getTime()) {
      // Window has not opened yet.
      ctaState.value = 'registration_closed';
      return;
    }
    if (t.registrationCloseAt && now >= new Date(t.registrationCloseAt).getTime()) {
      // Window has expired.
      ctaState.value = 'registration_closed';
      return;
    }
    // Window is active (or absent → status-only fallback per documented policy).
    if (!hasToken.value) {
      ctaState.value = 'register';
      return;
    }
    // Authenticated: check if user already has a registration.
    // 200 → view my registration; 404 → register; other errors → neutral (do not assume no registration).
    try {
      await registrationApi.value.getMyRegistration(slug);
      ctaState.value = 'view_registration';
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 404) {
        // Confirmed no registration exists for this user on this tournament.
        ctaState.value = 'register';
        return;
      }
      // Auth errors (401/403), server errors (5xx), or network failures must not
      // be treated as "no registration" — fall back to neutral to avoid a misleading Register CTA.
      ctaState.value = 'none';
    }
    return;
  }
  ctaState.value = 'none';
}

onMounted(async () => {
  void resolveCtaState();

  // Load game name from public games list (no direct fetch, no operational SDK).
  const t = tournament.value;
  if (t?.gameId) {
    try {
      const gamesApi = createGamesDiscoveryApi({
        baseUrl: runtimeConfig.public?.apiBaseUrl as string | undefined,
      });
      const res = await gamesApi.list({ limit: 100 });
      const match = res.items.find((g) => g.id === t.gameId);
      if (match) gameName.value = match.name;
    } catch {
      // game name is supplementary; silently skip on error
    }
  }
});

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

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'حذفی',
  round_robin: 'لیگ',
  manual: 'دستی',
};

const PARTICIPANT_TYPE_LABELS: Record<TournamentParticipantType, string> = {
  individual: 'فردی',
  team: 'تیمی',
  both: 'فردی و تیمی',
};

const statusLabel = computed(() =>
  tournament.value ? (STATUS_LABELS[tournament.value.status] ?? tournament.value.status) : '',
);

const formatLabel = computed(() =>
  tournament.value ? (FORMAT_LABELS[tournament.value.format] ?? tournament.value.format) : '',
);

const participantTypeLabel = computed(() =>
  tournament.value?.participantType
    ? (PARTICIPANT_TYPE_LABELS[tournament.value.participantType] ??
      tournament.value.participantType)
    : '',
);

const statusBadgeClass = computed(() => {
  const s = tournament.value?.status;
  if (s === 'in_progress') return 'dr-badge dr-badge-live';
  if (s === 'registration_open') return 'dr-badge dr-badge-success';
  if (s === 'cancelled') return 'dr-badge dr-badge-danger';
  return 'dr-badge';
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── SEO ─────────────────────────────────────────────────────────────────────

const siteName = (runtimeConfig.public?.siteName as string | undefined) ?? 'Dragon';
const isNotFound = computed(() => !pending.value && !tournament.value);

useHead(
  computed(() => {
    if (isNotFound.value || !!error.value) {
      return {
        title: 'تورنمنت یافت نشد',
        meta: [{ name: 'robots', content: 'noindex,follow' }],
      };
    }
    const t = tournament.value;
    if (!t) return { title: siteName };

    const title = `${t.title} — ${siteName}`;
    const description = t.description ?? `تورنمنت ${t.title}. جزئیات، زمان‌بندی و ثبت‌نام.`;

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
.tournament-detail-page {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
}

.tournament-detail-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-16) 0;
  text-align: center;
}

.tournament-detail-page__state-text {
  font-size: var(--text-body-size);
  color: var(--text-muted);
}

.tournament-detail-page__not-found-title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  margin: 0;
  color: var(--text-primary);
}

.tournament-detail-page__not-found-body {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
}

.tournament-detail-page__header {
  margin-bottom: var(--space-10);
}

.tournament-detail-page__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.tournament-detail-page__format,
.tournament-detail-page__game,
.tournament-detail-page__participant-type {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  font-family: var(--font-sans-en);
}

.tournament-detail-page__title {
  font-size: var(--text-h1-size);
  font-weight: var(--weight-bold);
  letter-spacing: var(--text-h1-tracking);
  margin: 0 0 var(--space-3) 0;
  color: var(--text-primary);
}

.tournament-detail-page__description {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.75;
}

.tournament-detail-page__info {
  margin-bottom: var(--space-10);
}

.tournament-detail-page__fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
}

.tournament-detail-page__field {
  background: var(--surface-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}

.tournament-detail-page__field dt {
  font-size: var(--text-caption-size);
  color: var(--text-muted);
  margin-bottom: var(--space-1);
}

.tournament-detail-page__field dd {
  font-size: var(--text-body-size);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.tournament-detail-page__section-title {
  font-size: var(--text-h3-size);
  font-weight: var(--weight-semibold);
  margin: 0 0 var(--space-4) 0;
  color: var(--text-primary);
}

.tournament-detail-page__rules {
  margin-bottom: var(--space-10);
}

.tournament-detail-page__rules-text {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  line-height: 1.75;
  margin: 0;
  white-space: pre-line;
}

.tournament-detail-page__cta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-8);
}

.tournament-detail-page__cta-label {
  font-size: var(--text-body-size);
  font-weight: var(--weight-semibold);
}

.tournament-detail-page__cta-label--muted {
  color: var(--text-muted);
}

.tournament-detail-page__cta-label--cancelled {
  color: var(--color-danger);
}
</style>
