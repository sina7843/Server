<template>
  <div>
    <h1>Admin Login</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="phone">Phone</label>
        <input
          id="phone"
          v-model="phone"
          type="tel"
          autocomplete="tel"
          :disabled="loading"
          required
        />
      </div>
      <div>
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          :disabled="loading"
          required
        />
      </div>
      <p v-if="errorMessage" role="alert">{{ errorMessage }}</p>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { adminLogin } from '~/features/auth/admin-auth.api';
import { useAdminAuthState } from '~/composables/useAdminAuthState';
import { useAdminPermissions } from '~/composables/useAdminPermissions';

const router = useRouter();
const route = useRoute();
const { setAuth } = useAdminAuthState();
const { setPermissions } = useAdminPermissions();
const {
  public: { apiBaseUrl },
} = useRuntimeConfig();

const phone = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  if (loading.value) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    const { token, identity } = await adminLogin(phone.value, password.value, String(apiBaseUrl));
    setAuth(token, identity);
    setPermissions(identity.permissions, identity.isSuperAdmin);

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    await router.push(redirect);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed. Please try again.';
  } finally {
    loading.value = false;
  }
}
</script>
