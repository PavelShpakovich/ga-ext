import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StyleButtonProps {
  icon: LucideIcon;
  label: string;
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const StyleButton: React.FC<StyleButtonProps> = ({ icon: Icon, label, isSelected, disabled, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'p-3 rounded-lg border-2 transition-all',
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <Icon className='w-6 h-6 mx-auto mb-1' />
      <div
        className={clsx(
          'text-sm font-medium',
          isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300',
        )}
      >
        {label}
      </div>
    </button>
  );
};
