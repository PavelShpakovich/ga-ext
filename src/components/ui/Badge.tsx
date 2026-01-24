import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  primary: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
