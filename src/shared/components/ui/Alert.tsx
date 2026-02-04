import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

export enum AlertVariant {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<AlertVariant, { icon: React.ReactNode; className: string }> = {
  [AlertVariant.INFO]: {
    icon: <Info className='w-4 h-4' />,
    className:
      'bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/30',
  },
  [AlertVariant.SUCCESS]: {
    icon: <CheckCircle className='w-4 h-4' />,
    className:
      'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30',
  },
  [AlertVariant.WARNING]: {
    icon: <AlertCircle className='w-4 h-4' />,
    className:
      'bg-amber-50/50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/30',
  },
  [AlertVariant.ERROR]: {
    icon: <XCircle className='w-4 h-4' />,
    className:
      'bg-rose-50/50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/30',
  },
};

export const Alert: React.FC<AlertProps> = ({ variant = AlertVariant.INFO, children, className = '' }) => {
  const config = variantConfig[variant];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${config.className} ${className}`}>
      <div className='shrink-0'>{config.icon}</div>
      <div className='flex-1 text-[13px] font-medium leading-relaxed'>{children}</div>
    </div>
  );
};
