import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAdminAuthState } from '~/composables/useAdminAuthState';

export default defineNuxtRouteMiddleware(() => {
  const { identity } = useAdminAuthState();

  if (!identity.value) {
    return navigateTo('/forbidden');
  }
});
