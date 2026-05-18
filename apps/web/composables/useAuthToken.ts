export function useAuthToken() {
  const token = useState<string | null>('dragon:access-token', () => null);

  function setToken(nextToken: string | null): void {
    token.value = nextToken;
  }

  function clearToken(): void {
    token.value = null;
  }

  return {
    token,
    hasToken: computed(() => Boolean(token.value)),
    setToken,
    clearToken,
  };
}
