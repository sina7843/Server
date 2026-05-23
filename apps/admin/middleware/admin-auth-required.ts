import type { RouteLocationNormalized } from 'vue-router';
import { useAdminAuthState } from '~/composables/useAdminAuthState';

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const { accessToken } = useAdminAuthState();

  if (!accessToken.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
  }
});
