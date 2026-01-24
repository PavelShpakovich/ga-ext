import React, { ReactElement, cloneElement } from 'react';
import clsx from 'clsx';

type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactElement;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'secondary',
  size = 'md',
  className,
  title,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantStyles: Record<IconButtonVariant, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg shadow-blue-500/20',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-300',
    ghost:
      'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-500',
    outline:
      'bg-transparent border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-slate-500',
    danger:
      'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 focus:ring-rose-500',
  };

  const sizeStyles: Record<IconButtonSize, string> = {
    xs: 'p-1 h-7 w-7',
    sm: 'p-1.5 h-9 w-9',
    md: 'p-2 h-11 w-11',
    lg: 'p-3 h-14 w-14',
  };

  const iconSizeStyles: Record<IconButtonSize, string> = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      title={title}
      disabled={disabled}
      type='button'
      {...props}
    >
      {cloneElement(icon as ReactElement<any>, {
        className: clsx(iconSizeStyles[size], (icon.props as any).className),
      })}
    </button>
  );
};
