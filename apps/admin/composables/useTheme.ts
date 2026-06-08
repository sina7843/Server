import { ref } from 'vue';

type Theme = 'dark' | 'light';

const _theme = ref<Theme>('dark');
const STORAGE_KEY = 'dragon-admin-theme';

export function useTheme() {
  function applyTheme(theme: Theme) {
    _theme.value = theme;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }

  function toggleTheme() {
    applyTheme(_theme.value === 'dark' ? 'light' : 'dark');
  }

  function initTheme() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferred: Theme = window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
    applyTheme(saved ?? preferred);
  }

  return { theme: _theme, toggleTheme, initTheme };
}
