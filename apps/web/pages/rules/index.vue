<template>
  <main class="content-page">
    <h1 class="content-page__title">قوانین</h1>
    <ContentStateMessage v-if="pending" state="loading" />
    <ContentStateMessage v-else-if="error" state="error" />
    <ContentList v-else-if="data && data.items.length > 0" :items="data.items" base-path="/rules" />
    <ContentStateMessage v-else state="empty" />
  </main>
</template>

<script setup lang="ts">
const content = usePublicContent();

const { data, pending, error } = await useAsyncData('rules-list', () => content.listRules());

useHead({ title: 'قوانین — دراگون' });
</script>

<style scoped>
.content-page {
  max-width: 56rem;
  margin: 2rem auto;
  padding: 0 1rem;
}

.content-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
  color: #1e293b;
}
</style>
