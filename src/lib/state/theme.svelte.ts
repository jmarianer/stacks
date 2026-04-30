import { browser } from '$app/environment';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'stacks-theme';

function createThemeState() {
  const stored = browser ? (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) : null;
  let mode = $state<ThemeMode>(stored ?? 'system');

  return {
    get mode() {
      return mode;
    },
    set(next: ThemeMode) {
      mode = next;
      localStorage.setItem(STORAGE_KEY, next);
    },
    cycle() {
      const order: ThemeMode[] = [/*'system',*/ 'dark', 'light'];
      const next = order[(order.indexOf(mode) + 1) % order.length];
      this.set(next);
    },
  };
}

export const themeState = createThemeState();
