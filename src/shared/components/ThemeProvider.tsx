import React, { useState, useEffect, useCallback } from 'react';
import { Theme } from '@/shared/types';
import { ThemeContext } from '@/shared/hooks/useTheme';

const THEME_STORAGE_KEY = 'theme-preference';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme provider component that manages and provides theme state to the entire app
 * Should wrap the app at the highest level
 *
 * @param children - React components to render
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(Theme.SYSTEM);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }, []);

  // Resolve user theme preference to actual light/dark value
  const resolveTheme = useCallback(
    (userTheme: Theme): 'light' | 'dark' => {
      if (userTheme === Theme.SYSTEM) {
        return getSystemTheme();
      }
      return userTheme === Theme.DARK ? 'dark' : 'light';
    },
    [getSystemTheme],
  );

  // Initialize theme from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const savedTheme = stored || Theme.SYSTEM;
    setThemeState(savedTheme);
    setResolvedTheme(resolveTheme(savedTheme));
    setMounted(true);
  }, [resolveTheme]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme, mounted]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== Theme.SYSTEM || !mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setResolvedTheme(getSystemTheme());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted, getSystemTheme]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        setResolvedTheme(resolveTheme(newTheme));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted, resolveTheme]);

  // Update theme and apply immediately
  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      const resolved = resolveTheme(newTheme);
      setResolvedTheme(resolved);

      // Apply immediately to DOM
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
      root.setAttribute('data-theme', resolved);

      // Save to storage
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    },
    [resolveTheme],
  );

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}
