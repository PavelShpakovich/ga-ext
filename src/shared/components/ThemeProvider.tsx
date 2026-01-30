import React, { ReactNode } from 'react';
import { useTheme } from '@/shared/hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme provider component that initializes and manages theme application
 * Should wrap the app at the highest level to ensure theme is applied before render
 * Prevents hydration mismatch by not rendering until mounted
 *
 * @param children - React components to render
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mounted } = useTheme();

  // Prevent hydration mismatch by waiting for client-side initialization
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
