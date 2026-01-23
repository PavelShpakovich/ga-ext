import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<AlertVariant, { icon: React.ReactNode; className: string }> = {
  info: {
    icon: <Info className='w-4 h-4' />,
    className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  },
  success: {
    icon: <CheckCircle className='w-4 h-4' />,
    className: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  },
  warning: {
    icon: <AlertCircle className='w-4 h-4' />,
    className: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  },
  error: {
    icon: <XCircle className='w-4 h-4' />,
    className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  },
};

export const Alert: React.FC<AlertProps> = ({ variant = 'info', children, className = '' }) => {
  const config = variantConfig[variant];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${config.className} ${className}`}>
      <div className='flex-shrink-0 mt-0.5'>{config.icon}</div>
      <div className='flex-1 text-sm'>{children}</div>
    </div>
  );
};
