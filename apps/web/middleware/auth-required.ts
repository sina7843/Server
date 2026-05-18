export default defineNuxtRouteMiddleware(() => {
  const { hasToken } = useAuthToken();

  if (!hasToken.value) {
    return navigateTo('/login');
  }

  return undefined;
});
