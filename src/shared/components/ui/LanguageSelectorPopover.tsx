import React from 'react';
import clsx from 'clsx';

export enum LanguageSelectorPopoverVariant {
  FULL = 'full',
  COMPACT = 'compact',
}

interface LanguageSelectorPopoverProps {
  variant?: LanguageSelectorPopoverVariant;
  children: React.ReactNode;
}

export const LanguageSelectorPopover: React.FC<LanguageSelectorPopoverProps> = ({
  variant = LanguageSelectorPopoverVariant.FULL,
  children,
}) => {
  return (
    <div
      className={clsx(
        'absolute z-50',
        'top-[calc(100%_+_12px)]',
        variant === LanguageSelectorPopoverVariant.FULL ? 'w-full left-0 right-0' : 'right-0 w-64',
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl',
        'animate-in fade-in zoom-in-95 duration-200 origin-top',
        variant === LanguageSelectorPopoverVariant.FULL
          ? 'shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]'
          : 'shadow-slate-200/50 dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)]',
      )}
    >
      {children}
    </div>
  );
};
