import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StyleButtonProps {
  icon: LucideIcon;
  label: string;
  isSelected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const StyleButton: React.FC<StyleButtonProps> = ({ icon: Icon, label, isSelected, disabled, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all duration-200 cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-1
        ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
      `}
      title={label}
    >
      <Icon className={`w-4 h-4 ${isSelected ? 'animate-in zoom-in-75 duration-300' : ''}`} />
      <span className='text-[10px] font-bold uppercase tracking-tight truncate w-full text-center'>{label}</span>
    </button>
  );
};
