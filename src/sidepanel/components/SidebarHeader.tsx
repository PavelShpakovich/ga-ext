import React from 'react';
import { FileText, Languages } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useTranslation } from 'react-i18next';

interface SidebarHeaderProps {
  title: string;
  subtitle: string;
  isModelCached: boolean;
  language: 'en' | 'ru';
  onLanguageChange: (lang: 'en' | 'ru') => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  title,
  subtitle,
  isModelCached,
  language,
  onLanguageChange,
}) => {
  const { t } = useTranslation();

  const toggleLanguage = () => {
    onLanguageChange(language === 'en' ? 'ru' : 'en');
  };

  const currentLangDisplay = language.toUpperCase();

  return (
    <header className='px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between'>
      <div className='flex items-center gap-3.5'>
        <div className='p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl'>
          <FileText className='w-6 h-6 text-blue-600 dark:text-blue-400' />
        </div>
        <div className='flex flex-col'>
          <h1 className='text-base font-bold tracking-tight text-slate-800 dark:text-white'>{title}</h1>
          <span className='text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold'>
            {subtitle}
          </span>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <button
          onClick={toggleLanguage}
          className='p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all group flex items-center gap-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 active:scale-95'
          title={t('ui.switch_language')}
        >
          <Languages className='w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors' />
          <span className='text-[10px] font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 uppercase tracking-widest'>
            {currentLangDisplay}
          </span>
        </button>
        <Badge
          variant={isModelCached ? 'success' : 'default'}
          className='text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest'
        >
          {isModelCached ? t('ui.local') : t('ui.remote')}
        </Badge>
      </div>
    </header>
  );
};
