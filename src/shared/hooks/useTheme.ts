import { useEffect, useState, useCallback } from 'react';
import { Theme } from '@/shared/types';

const THEME_STORAGE_KEY = 'theme-preference';

/**
 * Hook for managing theme preferences (light/dark/system)
 * - Respects system preference when set to 'system'
 * - Persists user preference to localStorage
 * - Syncs across tabs using storage events
 * - Listens for system theme changes and auto-applies
 *
 * @returns Object with theme state and control methods
 * @example
 * const { theme, setTheme, isDark } = useTheme();
 * setTheme(Theme.DARK);
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(Theme.SYSTEM);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    setThemeState(stored || Theme.SYSTEM);
    setMounted(true);
  }, []);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    if (!mounted) return;

    let effectiveTheme: 'light' | 'dark' = 'light';

    if (theme === Theme.SYSTEM) {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = theme === Theme.DARK ? 'dark' : 'light';
    }

    // Apply to document root
    const htmlElement = document.documentElement;
    if (effectiveTheme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  // Listen for system theme changes when system mode is active
  useEffect(() => {
    if (theme !== Theme.SYSTEM || !mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Trigger re-render to reapply theme based on new system preference
      setThemeState(Theme.SYSTEM);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // Sync theme across browser tabs
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        setThemeState(e.newValue as Theme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  /**
   * Update theme preference and persist to localStorage
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  /**
   * Get the effective theme (resolves 'system' to 'light' or 'dark')
   */
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (theme === Theme.SYSTEM) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme === Theme.DARK ? 'dark' : 'light';
  }, [theme]);

  return {
    theme,
    setTheme,
    getEffectiveTheme,
    isDark: theme === Theme.DARK || (theme === Theme.SYSTEM && getEffectiveTheme() === 'dark'),
    mounted,
  };
}
