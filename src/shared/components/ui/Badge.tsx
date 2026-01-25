import React from 'react';

export enum BadgeVariant {
  DEFAULT = 'default',
  PRIMARY = 'primary',
  SUCCESS = 'success',
  WARNING = 'warning',
  DANGER = 'danger',
}

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  [BadgeVariant.DEFAULT]: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  [BadgeVariant.PRIMARY]: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  [BadgeVariant.SUCCESS]: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  [BadgeVariant.WARNING]: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  [BadgeVariant.DANGER]: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
};

export const Badge: React.FC<BadgeProps> = ({ variant = BadgeVariant.DEFAULT, children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
