import React from 'react';
import { FileText } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

interface SidebarHeaderProps {
  title: string;
  subtitle: string;
  isModelCached: boolean;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ title, subtitle, isModelCached }) => {
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
      <Badge
        variant={isModelCached ? 'success' : 'default'}
        className='text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest'
      >
        {isModelCached ? 'Local' : 'Cloud'}
      </Badge>
    </header>
  );
};
