<template>
  <main class="homepage">
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />

    <template v-else-if="data">
      <EsportsHero v-if="data.featuredPosts[0]" :post="data.featuredPosts[0]" />

      <EsportsFeaturedCards
        v-if="data.featuredPosts.length > 1"
        :posts="data.featuredPosts.slice(1)"
      />

      <EsportsNewsGrid :posts="data.latestNews" />

      <EsportsTopContent :posts="data.topContent" />

      <EsportsTournamentSection
        v-if="data.activeTournaments.length > 0 || data.upcomingTournaments.length > 0"
        :active="data.activeTournaments"
        :upcoming="data.upcomingTournaments"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig();
const { data, pending, error } = await useEsportsHome();

const siteName = (runtimeConfig.public?.siteName as string | undefined) ?? 'Dragon';
const SITE_TITLE = `${siteName} — پلتفرم اسپورت`;
const SITE_DESCRIPTION =
  'پلتفرم رقابت‌های اسپورت ایران. اخبار، مقالات و محتوای ویژه بازی‌های رقابتی.';
const siteUrl = (runtimeConfig.public?.siteUrl as string | undefined) ?? '';

useHead({
  title: SITE_TITLE,
  meta: [
    { name: 'description', content: SITE_DESCRIPTION },
    { property: 'og:title', content: SITE_TITLE },
    { property: 'og:description', content: SITE_DESCRIPTION },
    { property: 'og:type', content: 'website' },
  ],
  link: siteUrl ? [{ rel: 'canonical', href: siteUrl }] : [],
});
</script>

<style scoped>
.homepage {
  max-width: var(--layout-content-max);
  margin: 0 auto;
  padding: 40px 24px 80px;
  animation: dr-fade-up 0.7s var(--ease-out) both;
}
</style>
