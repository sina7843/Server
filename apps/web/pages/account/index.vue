<template>
  <main class="account-shell">
    <h1>Account</h1>
    <p>Manage the basic identity settings for your account.</p>
    <nav>
      <NuxtLink to="/account/profile">Profile</NuxtLink>
      <NuxtLink to="/account/security">Security</NuxtLink>
    </nav>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth-required',
});

useHead({
  title: 'Account',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
});
</script>

<style scoped>
.account-shell {
  display: grid;
  gap: 1rem;
  margin: 2rem auto;
  max-width: 48rem;
}

.account-shell nav {
  display: flex;
  gap: 1rem;
}
</style>
