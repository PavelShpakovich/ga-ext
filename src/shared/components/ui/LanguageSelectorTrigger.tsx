import React from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { Language } from '@/shared/types';
import { LANGUAGE_CONFIG } from '@/core/constants';

interface LanguageSelectorTriggerProps {
  uiLanguage: Language;
  correctionLanguage: Language;
  isOpen: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}

export const LanguageSelectorTrigger: React.FC<LanguageSelectorTriggerProps> = ({
  uiLanguage,
  correctionLanguage,
  isOpen,
  onClick,
  disabled = false,
  title,
}) => {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full group flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        isOpen
          ? 'border-blue-500 shadow-lg shadow-blue-500/5 ring-4 ring-blue-500/5 focus-visible:ring-blue-500/30'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-visible:ring-blue-500/20',
        disabled ? 'opacity-60 cursor-not-allowed border-dashed' : 'cursor-pointer',
      )}
      title={title}
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
          <Languages size={18} />
        </div>
        <div className='flex flex-col items-start min-w-0'>
          <span className='text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none'>
            Language Settings
          </span>
          <div className='flex items-center gap-1.5 truncate'>
            <span className='text-[13px] font-semibold text-slate-700 dark:text-slate-200'>
              {LANGUAGE_CONFIG[uiLanguage].name}
            </span>
            <span className='text-slate-300 dark:text-slate-700 text-[10px] transform translate-y-[1px]'>/</span>
            <span className='text-[13px] font-medium text-slate-500 dark:text-slate-400'>
              {LANGUAGE_CONFIG[correctionLanguage].name}
            </span>
          </div>
        </div>
      </div>
      <ChevronDown
        size={16}
        className={clsx(
          'text-slate-300 transition-transform duration-300 ease-out shrink-0',
          isOpen && 'rotate-180 text-blue-500',
        )}
      />
    </button>
  );
};
