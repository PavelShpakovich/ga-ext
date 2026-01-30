import { createContext, useContext } from 'react';
import { Theme } from '@/shared/types';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook for accessing and managing theme state
 * Must be used within ThemeProvider
 *
 * @returns Object with theme state and setTheme function
 * @example
 * const { theme, resolvedTheme, setTheme } = useTheme();
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export { ThemeContext };
