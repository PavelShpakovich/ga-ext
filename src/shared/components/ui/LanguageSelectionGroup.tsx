import React from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import { Language } from '@/shared/types';
import { LANGUAGE_CONFIG } from '@/core/constants';

export enum LanguageSelectionColor {
  BLUE = 'blue',
  INDIGO = 'indigo',
}

interface LanguageSelectionGroupProps {
  languages: Language[];
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  disabled?: boolean;
  color?: LanguageSelectionColor;
}

const colorConfig: Record<LanguageSelectionColor, { selected: string; focus: string }> = {
  [LanguageSelectionColor.BLUE]: {
    selected: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400',
    focus: 'focus-visible:ring-blue-500/30',
  },
  [LanguageSelectionColor.INDIGO]: {
    selected:
      'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    focus: 'focus-visible:ring-indigo-500/30',
  },
};

export const LanguageSelectionGroup: React.FC<LanguageSelectionGroupProps> = ({
  languages,
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  color = LanguageSelectionColor.BLUE,
}) => {
  const { selected, focus } = colorConfig[color];

  return (
    <div className='grid grid-cols-2 gap-2'>
      {languages.map((lang) => (
        <button
          key={lang}
          type='button'
          onClick={() => onLanguageChange(lang)}
          disabled={disabled}
          className={clsx(
            'flex items-center justify-between px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed',
            selectedLanguage === lang
              ? clsx(selected, focus)
              : 'bg-slate-50/50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 focus-visible:ring-slate-500/30 cursor-pointer',
          )}
        >
          {LANGUAGE_CONFIG[lang].name}
          {selectedLanguage === lang && <Check size={14} className='shrink-0' />}
        </button>
      ))}
    </div>
  );
};
