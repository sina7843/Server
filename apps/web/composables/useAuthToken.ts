export function useAuthToken() {
  const token = useCookie<string | null>('dragon_access_token', {
    sameSite: 'lax',
  });

  return {
    token,
    hasToken: computed(() => Boolean(token.value)),
  };
}
