<template>
  <main class="account-security-page">
    <h1>Security</h1>
    <p>
      Basic authentication, session, and password foundations are handled by the auth system.
      Expanded security controls are intentionally not part of this profile slice.
    </p>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth-required',
});

useHead({
  title: 'Account security',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
});
</script>

<style scoped>
.account-security-page {
  margin: 2rem auto;
  max-width: 48rem;
}
</style>
