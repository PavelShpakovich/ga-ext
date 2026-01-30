import React from 'react';
import { LanguageSelector, LanguageSelectorVariant } from './LanguageSelector';
import { ThemeSelector } from '@/shared/components/ui';
import { useTheme } from '@/shared/hooks/useTheme';

interface SidebarHeaderProps {
  title: string;
  subtitle: string;
  isBusy?: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, subtitle, isBusy = false }) => {
  const { resolvedTheme } = useTheme();
  const iconSrc = chrome.runtime.getURL(`icons/icon128${resolvedTheme === 'light' ? '-light' : ''}.png`);

  return (
    <header className='px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between transition-colors duration-500'>
      <div className='flex items-center gap-3.5'>
        <div className='w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/10 border border-white dark:border-slate-800 transition-all'>
          <img src={iconSrc} alt='Grammar Assistant' className='w-full h-full object-contain rounded-lg' />
        </div>
        <div className='flex flex-col'>
          <h1 className='text-base font-bold tracking-tight text-slate-800 dark:text-white'>{title}</h1>
          <span className='text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold'>
            {subtitle}
          </span>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <ThemeSelector />
        <LanguageSelector variant={LanguageSelectorVariant.COMPACT} disabled={isBusy} />
      </div>
    </header>
  );
};
