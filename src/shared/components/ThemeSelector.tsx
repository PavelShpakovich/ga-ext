import React, { useCallback } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/shared/types';
import { useTheme } from '@/shared/hooks/useTheme';
import { IconButton, IconButtonSize, IconButtonVariant } from '@/shared/components/ui';

const THEME_CYCLE: Theme[] = [Theme.LIGHT, Theme.DARK, Theme.SYSTEM];

const themeIcons = {
  [Theme.LIGHT]: <Sun size={18} />,
  [Theme.DARK]: <Moon size={18} />,
  [Theme.SYSTEM]: <Monitor size={18} />,
};

const themeLabelKeys = {
  [Theme.LIGHT]: 'theme.light',
  [Theme.DARK]: 'theme.dark',
  [Theme.SYSTEM]: 'theme.system',
};

/**
 * Theme selector toggle button that cycles through light/dark/system modes
 * Clicking the button cycles to the next theme
 *
 * @example
 * <ThemeSelector />
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const handleThemeToggle = useCallback(() => {
    const currentIndex = THEME_CYCLE.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
    setTheme(THEME_CYCLE[nextIndex]);
  }, [theme, setTheme]);

  return (
    <IconButton
      icon={themeIcons[theme]}
      size={IconButtonSize.SM}
      variant={IconButtonVariant.SECONDARY}
      onClick={handleThemeToggle}
      title={`${t(themeLabelKeys[theme])} — ${t('common.click_to_cycle')}`}
      aria-label={`${t('theme.toggle')} (${t(themeLabelKeys[theme])})`}
    />
  );
}
