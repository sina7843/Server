const STORAGE_KEY = 'dragon:access-token';

export default defineNuxtPlugin(() => {
  const { token, setToken } = useAuthToken();

  // Restore token from localStorage on app startup
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
    }

    // Persist token changes to localStorage
    watch(
      token,
      (next) => {
        if (next) {
          localStorage.setItem(STORAGE_KEY, next);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      },
      { immediate: false },
    );
  }
});
