<template>
  <div class="dashboard">
    <h1 class="page-title">داشبورد</h1>
    <p class="page-intro">به پنل مدیریت Dragon خوش آمدید.</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth-required'] });
useHead({ title: 'داشبورد — Dragon Admin' });
</script>

<style scoped>
.dashboard {
  max-width: 900px;
}

.page-title {
  margin: 0 0 0.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
}

.page-intro {
  margin: 0;
  font-size: 0.95rem;
  color: #64748b;
}
</style>
