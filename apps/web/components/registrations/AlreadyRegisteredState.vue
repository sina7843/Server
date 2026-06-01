<template>
  <div class="already-registered-state" role="status">
    <p>You are already registered for this tournament.</p>
    <RegistrationStatusBadge :status="registration.status" />
    <a href="my-registration" class="view-link">View my registration</a>
  </div>
</template>

<script setup lang="ts">
import type { MyTournamentRegistrationDto } from '@dragon/types';

defineProps<{
  registration: MyTournamentRegistrationDto;
}>();
</script>

<style scoped>
.already-registered-state {
  display: grid;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  background: #f0fdf4;
  border-radius: 0.5rem;
  border: 1px solid #bbf7d0;
}

.view-link {
  display: inline-block;
  padding: 0.45rem 1rem;
  background: #16a34a;
  color: #fff;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 500;
}

.view-link:hover {
  background: #15803d;
}
</style>
