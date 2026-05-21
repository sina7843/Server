import { defineNuxtRouteMiddleware, navigateTo } from '#app';
import { useAdminAuthState } from '~/composables/useAdminAuthState';

export default defineNuxtRouteMiddleware((to) => {
  const { accessToken } = useAdminAuthState();

  if (!accessToken.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
  }
});
