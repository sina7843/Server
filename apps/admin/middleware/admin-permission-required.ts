import type { RouteLocationNormalized } from 'vue-router';
import { useAdminPermissions } from '~/composables/useAdminPermissions';

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const requiredPermission = to.meta.requiredPermission as string | undefined;

  if (!requiredPermission) return;

  const { hasPermission } = useAdminPermissions();

  if (!hasPermission(requiredPermission)) {
    return navigateTo('/forbidden');
  }
});
