<template>
  <main class="tp">
    <div class="tp-bg-glow" aria-hidden="true"></div>

    <!-- ── Loading skeleton ─────────────────────────────────────────────────── -->
    <div v-if="pending" class="tp-skel-wrap" aria-busy="true" aria-label="در حال بارگذاری">
      <div class="tp-skel-hero"></div>
      <div class="tp-body">
        <div class="tp-skel-sidebar">
          <div class="tp-skel tp-skel--chip"></div>
          <div class="tp-skel tp-skel--line"></div>
          <div class="tp-skel tp-skel--line tp-skel--short"></div>
          <div class="tp-skel tp-skel--block"></div>
        </div>
        <div class="tp-skel-main">
          <div class="tp-skel tp-skel--tabs"></div>
          <div class="tp-skel tp-skel--block"></div>
          <div class="tp-skel tp-skel--block tp-skel--tall"></div>
        </div>
      </div>
    </div>

    <!-- ── Not found ────────────────────────────────────────────────────────── -->
    <div v-else-if="error || !tournament" class="tp-notfound" role="alert">
      <div class="tp-notfound__glyph" aria-hidden="true">404</div>
      <h1 class="tp-notfound__title">تورنمنت یافت نشد</h1>
      <p class="tp-notfound__body">این تورنمنت وجود ندارد یا در دسترس عمومی نیست.</p>
      <NuxtLink to="/tournaments" class="dr-btn dr-btn-secondary dr-btn-lg">بازگشت به تورنمنت‌ها</NuxtLink>
    </div>

    <!-- ── Main layout ───────────────────────────────────────────────────────── -->
    <template v-else>
      <!-- Hero: full-width cover + title + caption -->
      <div class="tp-hero" :style="heroCoverStyle" role="banner" aria-label="تصویر کاور تورنمنت">
        <div class="tp-hero__scrim" aria-hidden="true"></div>
        <div class="tp-hero__content">
          <div class="tp-hero__chips">
            <span :class="statusBadgeClass">{{ statusLabel }}</span>
            <span v-if="gameName" class="tp-chip">{{ gameName }}</span>
            <span class="tp-chip">{{ formatLabel }}</span>
            <span v-if="tournament.participantType" class="tp-chip">{{ participantTypeLabel }}</span>
          </div>
          <h1 class="tp-hero__title">{{ tournament.title }}</h1>
          <p v-if="tournament.description" class="tp-hero__desc">{{ tournament.description }}</p>
        </div>
      </div>

      <!-- Two-column body: sidebar (left) + main (right) -->
      <!-- In RTL grid-template-areas "main sidebar" → main=right, sidebar=left ✓ -->
      <div class="tp-body">

        <!-- Left: tournament info + CTA (sticky) -->
        <aside class="tp-sidebar" aria-label="اطلاعات تورنمنت">

          <!-- Stats card -->
          <dl
            v-if="tournament.capacity || tournament.startsAt || tournament.registrationOpenAt || tournament.registrationCloseAt || tournament.endsAt"
            class="tp-stats-card"
          >
            <div v-if="tournament.capacity" class="tp-stat">
              <dt class="tp-stat__label">ظرفیت</dt>
              <dd class="tp-stat__value">
                <span class="tp-stat__num">{{ tournament.capacity }}</span>
                <span class="tp-stat__unit"> نفر</span>
              </dd>
            </div>
            <div v-if="tournament.participantType" class="tp-stat">
              <dt class="tp-stat__label">نوع شرکت‌کننده</dt>
              <dd class="tp-stat__value">{{ participantTypeLabel }}</dd>
            </div>
            <div v-if="tournament.startsAt" class="tp-stat">
              <dt class="tp-stat__label">شروع</dt>
              <dd class="tp-stat__value tp-stat__value--date">{{ formatDate(tournament.startsAt) }}</dd>
            </div>
            <div v-if="tournament.registrationOpenAt" class="tp-stat">
              <dt class="tp-stat__label">باز شدن ثبت‌نام</dt>
              <dd class="tp-stat__value tp-stat__value--date">{{ formatDate(tournament.registrationOpenAt) }}</dd>
            </div>
            <div v-if="tournament.registrationCloseAt" class="tp-stat">
              <dt class="tp-stat__label">بسته شدن ثبت‌نام</dt>
              <dd class="tp-stat__value tp-stat__value--date">{{ formatDate(tournament.registrationCloseAt) }}</dd>
            </div>
            <div v-if="tournament.endsAt" class="tp-stat">
              <dt class="tp-stat__label">پایان</dt>
              <dd class="tp-stat__value tp-stat__value--date">{{ formatDate(tournament.endsAt) }}</dd>
            </div>
          </dl>

          <!-- Rules card -->
          <div v-if="tournament.rules" class="tp-rules-card">
            <div class="tp-rules-card__heading">قوانین</div>
            <p class="tp-rules-card__body">{{ tournament.rules }}</p>
          </div>

          <!-- CTA -->
          <div class="tp-cta">
            <template v-if="ctaState === 'register'">
              <NuxtLink :to="`/tournaments/${tournament.slug}/register`" class="dr-btn dr-btn-primary tp-cta__btn">
                ثبت‌نام در تورنمنت
              </NuxtLink>
            </template>
            <template v-else-if="ctaState === 'view_registration'">
              <NuxtLink :to="`/tournaments/${tournament.slug}/my-registration`" class="dr-btn dr-btn-secondary tp-cta__btn">
                مشاهده ثبت‌نام من
              </NuxtLink>
            </template>
            <template v-else-if="ctaState === 'registration_closed'">
              <span class="tp-cta__state tp-cta__state--muted">ثبت‌نام بسته است</span>
            </template>
            <template v-else-if="ctaState === 'in_progress'">
              <span class="tp-cta__state dr-badge dr-badge-live">در حال برگزاری</span>
            </template>
            <template v-else-if="ctaState === 'completed'">
              <span class="tp-cta__state tp-cta__state--muted">رقابت پایان یافته</span>
            </template>
            <template v-else-if="ctaState === 'cancelled'">
              <span class="tp-cta__state tp-cta__state--danger">لغو شده</span>
            </template>
          </div>

        </aside>

        <!-- Right: tab nav + child route -->
        <div class="tp-main">
          <nav class="tp-tabs" aria-label="بخش‌های تورنمنت">
            <NuxtLink :to="`/tournaments/${tournament.slug}/participants`" class="tp-tab">شرکت‌کنندگان</NuxtLink>
            <NuxtLink :to="`/tournaments/${tournament.slug}/matches`" class="tp-tab">مسابقات</NuxtLink>
            <NuxtLink :to="`/tournaments/${tournament.slug}/results`" class="tp-tab">نتایج</NuxtLink>
            <NuxtLink :to="`/tournaments/${tournament.slug}/standings`" class="tp-tab">جدول رده‌بندی</NuxtLink>
            <NuxtLink :to="`/tournaments/${tournament.slug}/bracket`" class="tp-tab">براکت</NuxtLink>
          </nav>
          <NuxtPage />
        </div>

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

// ─── Hero cover style ─────────────────────────────────────────────────────────

const STATUS_COVER_GRADIENTS: Partial<Record<TournamentStatus, string>> = {
  registration_open: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #0d9488 100%)',
  in_progress: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 40%, #dc2626 100%)',
  completed: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
  registration_closed: 'linear-gradient(135deg, #1e1b2e 0%, #312e42 40%, #6d28d9 100%)',
  published: 'linear-gradient(145deg, #2d1b69 0%, #5b21b6 100%)',
  cancelled: 'linear-gradient(135deg, #1c1917 0%, #292524 40%, #44403c 100%)',
};

const COVER_FALLBACK = 'linear-gradient(145deg, #2d1b69 0%, #5b21b6 100%)';

const heroCoverStyle = computed(() => {
  const t = tournament.value;
  if (!t) return {};
  const imgUrl = t.coverImageUrl ?? t.gameCoverImageUrl;
  if (imgUrl) {
    return {
      backgroundImage: `url(${imgUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return { background: STATUS_COVER_GRADIENTS[t.status] ?? COVER_FALLBACK };
});

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
/* ── Shell ───────────────────────────────────────────────────────────────── */
.tp {
  position: relative;
  min-height: 100dvh;
}

.tp-bg-glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 50% 50% at 85% 8%, rgba(109, 40, 217, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 30% 30% at 8% 80%, rgba(109, 40, 217, 0.08) 0%, transparent 55%);
  z-index: 0;
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
.tp-hero {
  position: relative;
  z-index: 1;
  height: 380px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}

.tp-hero__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(5, 3, 14, 0.88) 0%,
    rgba(5, 3, 14, 0.5) 40%,
    rgba(5, 3, 14, 0.15) 100%
  );
}

.tp-hero__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* Align with the body's max-width container */
  padding: 0 max(24px, calc((100vw - 1200px) / 2 + 24px)) 40px;
}

.tp-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.tp-chip {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  font-weight: var(--weight-medium);
  color: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  letter-spacing: 0.02em;
}

.tp-hero__title {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin: 0 0 10px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.6);
}

.tp-hero__desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.68);
  line-height: 1.65;
  margin: 0;
  max-width: 58ch;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Two-column body ─────────────────────────────────────────────────────── */
/* RTL: "main" = right (start), "sidebar" = left (end) */
.tp-body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-areas: "main sidebar";
  grid-template-columns: 1fr 280px;
  gap: 28px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  align-items: start;
}

/* ── Left sidebar ────────────────────────────────────────────────────────── */
.tp-sidebar {
  grid-area: sidebar;
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Stats card */
.tp-stats-card {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    var(--shadow-lg);
  padding: var(--space-2) var(--space-5);
  display: flex;
  flex-direction: column;
  margin: 0;
}

.tp-stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 9px 0;
  border-bottom: 1px solid var(--glass-hairline);
}

.tp-stat:last-child {
  border-bottom: none;
}

.tp-stat__label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  flex-shrink: 0;
}

.tp-stat__value {
  font-size: 12px;
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin: 0;
  text-align: left;
  direction: ltr;
}

.tp-stat__num {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
  background: var(--brand-gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tp-stat__unit {
  font-size: 11px;
  color: var(--text-muted);
}

.tp-stat__value--date {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}

/* Rules card */
.tp-rules-card {
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4) var(--space-5);
}

.tp-rules-card__heading {
  font-size: 11px;
  font-weight: var(--weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.tp-rules-card__body {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0;
  white-space: pre-line;
  display: -webkit-box;
  -webkit-line-clamp: 7;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* CTA */
.tp-cta {
  display: flex;
  flex-direction: column;
}

.tp-cta__btn {
  width: 100%;
  justify-content: center;
}

.tp-cta__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  font-size: 13px;
  font-weight: var(--weight-semibold);
  border-radius: var(--radius-md);
}

.tp-cta__state--muted {
  color: var(--text-disabled);
  border: 1px solid var(--glass-hairline);
}

.tp-cta__state--danger {
  color: var(--danger-400);
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.06);
}

/* ── Right main ──────────────────────────────────────────────────────────── */
.tp-main {
  grid-area: main;
  min-width: 0;
}

/* Tab navigation */
.tp-tabs {
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid var(--glass-hairline);
  margin-bottom: 24px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tp-tabs::-webkit-scrollbar {
  display: none;
}

.tp-tab {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: var(--weight-medium);
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    color var(--motion-fast) var(--ease-out),
    border-color var(--motion-fast) var(--ease-out);
}

.tp-tab:hover {
  color: var(--text-secondary);
}

.tp-tab.router-link-active {
  color: var(--purple-300);
  border-bottom-color: var(--purple-500);
  font-weight: var(--weight-semibold);
}

/* ── Loading skeleton ────────────────────────────────────────────────────── */
.tp-skel-wrap {
  position: relative;
  z-index: 1;
}

.tp-skel-hero {
  width: 100%;
  height: 380px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.07) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: tp-shimmer 1.8s ease-in-out infinite;
}

.tp-skel-sidebar {
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: var(--space-5);
  background: var(--surface-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
}

.tp-skel-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tp-skel {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: tp-shimmer 1.6s ease-in-out infinite;
}

@keyframes tp-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.tp-skel--chip  { height: 22px; width: 90px; border-radius: var(--radius-pill); }
.tp-skel--line  { height: 13px; width: 100%; }
.tp-skel--short { width: 60%; }
.tp-skel--block { height: 180px; border-radius: var(--radius-xl); }
.tp-skel--tall  { height: 320px; border-radius: var(--radius-xl); }
.tp-skel--tabs  { height: 44px; width: 100%; border-radius: var(--radius-md); }

/* ── Not found ───────────────────────────────────────────────────────────── */
.tp-notfound {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  min-height: 60dvh;
  padding: var(--space-16) var(--space-6);
  text-align: center;
}

.tp-notfound__glyph {
  font-family: var(--font-display);
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  background: var(--brand-gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.5;
  letter-spacing: -0.04em;
}

.tp-notfound__title {
  font-size: var(--text-h2-size);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
  margin: 0;
  letter-spacing: var(--text-h2-tracking);
}

.tp-notfound__body {
  font-size: var(--text-body-size);
  color: var(--text-muted);
  margin: 0;
  max-width: 38ch;
  line-height: 1.65;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .tp-hero {
    height: 280px;
  }

  .tp-hero__content {
    padding: 0 16px 28px;
  }

  .tp-hero__title {
    font-size: 26px;
  }

  .tp-body {
    grid-template-areas: "sidebar" "main";
    grid-template-columns: 1fr;
    padding: 20px 16px 80px;
    gap: 20px;
  }

  .tp-sidebar {
    position: static;
  }
}

@media (max-width: 600px) {
  .tp-hero {
    height: 240px;
  }

  .tp-hero__title {
    font-size: 22px;
  }

  .tp-notfound__glyph {
    font-size: 72px;
  }
}
</style>
