import React from 'react';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

export interface TabOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabSelectorProps {
  options: TabOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
  disabled?: boolean;
}
export const TabSelector: React.FC<TabSelectorProps> = ({
  options,
  selectedId,
  onSelect,
  className = '',
  disabled = false,
}) => {
  return (
    <div className={clsx('flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg', className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedId === option.id;

        return (
          <button
            key={option.id}
            onClick={() => !disabled && onSelect(option.id)}
            disabled={disabled}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              isSelected
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
            )}
          >
            <Icon className='w-3.5 h-3.5' />
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
