import React, { useState, useRef, useCallback } from 'react';
import { Language } from '@/shared/types';
import { LANGUAGE_CONFIG } from '@/core/constants';
import { changeLanguage } from '@/core/i18n';
import { useSettings } from '@/shared/hooks/useSettings';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useTranslation } from 'react-i18next';
import { Languages, Globe, ChevronDown, Check } from 'lucide-react';
import clsx from 'clsx';

// --- Constants ---
const POPOVER_OFFSET = 'calc(100% + 12px)';
const ICON_SIZE = 18;
const CHEVRON_SIZE = 16;
const DROPDOWN_WIDTH = '16rem'; // w-64
const Z_INDEX_POPOVER = 60;

export enum LanguageSelectorVariant {
  FULL = 'full',
  COMPACT = 'compact',
}

interface LanguageSelectorProps {
  disabled?: boolean;
  variant?: LanguageSelectorVariant;
}

/**
 * Compact Language Selector with a dropdown-like popover.
 * Allows independent selection of UI/Interface and Text/Correction languages.
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
        console.error('Failed to change UI language:', error);
      }
    },
    [updateSettings],
  );

  const handleCorrectionLanguageChange = useCallback(
    async (newLanguage: Language) => {
      try {
        await updateSettings({ correctionLanguage: newLanguage });
      } catch (error) {
        console.error('Failed to change correction language:', error);
      }
    },
    [updateSettings],
  );

  // Close dropdown when clicking outside
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
      {/* Trigger Button */}
      {variant === LanguageSelectorVariant.COMPACT ? (
        <button
          type='button'
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-300',
            isOpen
              ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 dark:group-hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700',
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
          )}
          title={disabled ? t('settings.disabled_while_busy') : t('settings.language_settings')}
        >
          <Languages size={ICON_SIZE} />
        </button>
      ) : (
        <button
          type='button'
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'w-full group flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-300',
            isOpen
              ? 'border-blue-500 shadow-lg shadow-blue-500/5 ring-4 ring-blue-500/5'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
            disabled ? 'opacity-60 cursor-not-allowed border-dashed' : 'cursor-pointer',
          )}
          title={disabled ? t('settings.disabled_while_busy') : undefined}
        >
          <div className='flex items-center gap-3'>
            <div
              className={clsx(
                'p-2 rounded-xl transition-colors duration-300',
                isOpen
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:group-hover:text-slate-300',
              )}
            >
              <Languages size={ICON_SIZE} />
            </div>
            <div className='flex flex-col items-start min-w-0'>
              <span className='text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1'>
                {t('settings.language_settings')}
              </span>
              <div className='flex items-center gap-1.5 truncate'>
                <span className='text-[13px] font-semibold text-slate-700 dark:text-slate-200'>
                  {LANGUAGE_CONFIG[settings.language].name}
                </span>
                <span className='text-slate-300 dark:text-slate-700 text-[10px] transform translate-y-[1px]'>/</span>
                <span className='text-[13px] font-medium text-slate-500 dark:text-slate-400'>
                  {LANGUAGE_CONFIG[settings.correctionLanguage].name}
                </span>
              </div>
            </div>
          </div>
          <ChevronDown
            size={CHEVRON_SIZE}
            className={clsx(
              'text-slate-300 transition-transform duration-300 ease-out shrink-0',
              isOpen && 'rotate-180 text-blue-500',
            )}
          />
        </button>
      )}

      {/* Dropdown Menu (Popover) */}
      {isOpen && (
        <div
          style={{
            top: POPOVER_OFFSET,
            zIndex: Z_INDEX_POPOVER,
            width: variant === LanguageSelectorVariant.FULL ? '100%' : DROPDOWN_WIDTH,
          }}
          className={clsx(
            'absolute bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top',
            variant === LanguageSelectorVariant.FULL
              ? 'left-0 right-0 shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
              : 'right-0 shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)]',
          )}
        >
          <div className='space-y-6'>
            {/* UI Language Selection */}
            <div>
              <div className='flex items-center gap-2 mb-3 px-1'>
                <Globe size={13} className='text-blue-500' />
                <span className='text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight'>
                  {t('settings.ui_language')}
                </span>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                {languages.map((lang) => (
                  <button
                    key={`ui-${lang}`}
                    onClick={() => handleUiLanguageChange(lang)}
                    className={clsx(
                      'relative flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border cursor-pointer',
                      settings.language === lang
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400',
                    )}
                  >
                    {LANGUAGE_CONFIG[lang].name}
                    {settings.language === lang && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <div className='h-px bg-slate-100 dark:bg-slate-800' />

            {/* Correction Language Selection */}
            <div>
              <div className='flex items-center gap-2 mb-3 px-1'>
                <Languages size={13} className='text-indigo-500' />
                <span className='text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight'>
                  {t('settings.correction_language')}
                </span>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                {languages.map((lang) => (
                  <button
                    key={`corr-${lang}`}
                    onClick={() => handleCorrectionLanguageChange(lang)}
                    className={clsx(
                      'relative flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border cursor-pointer',
                      settings.correctionLanguage === lang
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400',
                    )}
                  >
                    {LANGUAGE_CONFIG[lang].name}
                    {settings.correctionLanguage === lang && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
