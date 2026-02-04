import React, { useState, useRef, useCallback } from 'react';
import { Language } from '@/shared/types';
import { changeLanguage } from '@/core/i18n';
import { useSettings } from '@/shared/hooks/useSettings';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useTranslation } from 'react-i18next';
import { Logger } from '@/core/services/Logger';
import { Languages, Globe } from 'lucide-react';
import clsx from 'clsx';
import { IconButton, IconButtonVariant, IconButtonSize } from '@/shared/components/ui/IconButton';
import { LanguageSelectionGroup, LanguageSelectionColor } from '@/shared/components/ui/LanguageSelectionGroup';
import { LanguageSelectorTrigger } from '@/shared/components/ui/LanguageSelectorTrigger';
import {
  LanguageSelectorPopover,
  LanguageSelectorPopoverVariant,
} from '@/shared/components/ui/LanguageSelectorPopover';

export enum LanguageSelectorVariant {
  FULL = 'full',
  COMPACT = 'compact',
}

interface LanguageSelectorProps {
  disabled?: boolean;
  variant?: LanguageSelectorVariant;
}

/**
 * Compact Language Selector with dropdown popover.
 * Allows independent selection of UI and correction languages.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  disabled = false,
  variant = LanguageSelectorVariant.FULL,
}) => {
  const { t } = useTranslation();
  const { settings, updateSettings, isLoading } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleUiLanguageChange = useCallback(
    async (newLanguage: Language) => {
      try {
        await changeLanguage(newLanguage);
        await updateSettings({ language: newLanguage });
      } catch (error) {
        Logger.error('LanguageSelector', 'Failed to change UI language', error);
      }
    },
    [updateSettings],
  );

  const handleCorrectionLanguageChange = useCallback(
    async (newLanguage: Language) => {
      try {
        await updateSettings({ correctionLanguage: newLanguage });
      } catch (error) {
        Logger.error('LanguageSelector', 'Failed to change correction language', error);
      }
    },
    [updateSettings],
  );

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  if (isLoading) {
    return <div className='h-14 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl' />;
  }

  const languages = Object.values(Language);

  return (
    <div
      className={clsx('relative', variant === LanguageSelectorVariant.FULL ? 'w-full' : 'shrink-0')}
      ref={containerRef}
    >
      {variant === LanguageSelectorVariant.COMPACT ? (
        <IconButton
          icon={<Languages size={18} />}
          variant={isOpen ? IconButtonVariant.PRIMARY : IconButtonVariant.SECONDARY}
          size={IconButtonSize.SM}
          onClick={() => setIsOpen(!isOpen)}
          title={disabled ? t('settings.disabled_while_busy') : t('settings.language_settings')}
        />
      ) : (
        <LanguageSelectorTrigger
          uiLanguage={settings.language}
          correctionLanguage={settings.correctionLanguage}
          isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          title={disabled ? t('settings.disabled_while_busy') : undefined}
        />
      )}

      {isOpen && (
        <LanguageSelectorPopover
          variant={
            variant === LanguageSelectorVariant.FULL
              ? LanguageSelectorPopoverVariant.FULL
              : LanguageSelectorPopoverVariant.COMPACT
          }
        >
          <div className='flex flex-col gap-6'>
            <div>
              <div className='flex items-center gap-2 px-1'>
                <Globe size={13} className='text-blue-500' />
                <span className='text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight'>
                  {t('settings.ui_language')}
                </span>
              </div>
              <LanguageSelectionGroup
                languages={languages}
                selectedLanguage={settings.language}
                onLanguageChange={handleUiLanguageChange}
                disabled={false}
                color={LanguageSelectionColor.BLUE}
              />
            </div>

            <div className='h-px bg-slate-100 dark:bg-slate-800' />

            <div>
              <div className='flex items-center gap-2 px-1'>
                <Languages size={13} className='text-indigo-500' />
                <span className='text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight'>
                  {t('settings.correction_language')}
                </span>
              </div>
              <LanguageSelectionGroup
                languages={languages}
                selectedLanguage={settings.correctionLanguage}
                onLanguageChange={handleCorrectionLanguageChange}
                disabled={disabled}
                color={LanguageSelectionColor.INDIGO}
              />
            </div>
          </div>
        </LanguageSelectorPopover>
      )}
    </div>
  );
};

export default LanguageSelector;
