import React, { ReactElement, cloneElement } from 'react';
import clsx from 'clsx';

export enum IconButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  DANGER = 'danger',
  OUTLINE = 'outline',
}

export enum IconButtonSize {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactElement;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = IconButtonVariant.SECONDARY,
  size = IconButtonSize.MD,
  className,
  title,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantStyles: Record<IconButtonVariant, string> = {
    [IconButtonVariant.PRIMARY]:
      'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500/30 shadow-md shadow-blue-500/15',
    [IconButtonVariant.SECONDARY]:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:ring-slate-300/30',
    [IconButtonVariant.GHOST]:
      'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-slate-500/30',
    [IconButtonVariant.OUTLINE]:
      'bg-transparent border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:ring-slate-500/30',
    [IconButtonVariant.DANGER]:
      'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 focus-visible:ring-rose-500/30',
  };

  const sizeStyles: Record<IconButtonSize, string> = {
    [IconButtonSize.XS]: 'p-1 h-7 w-7',
    [IconButtonSize.SM]: 'p-1.5 h-9 w-9',
    [IconButtonSize.MD]: 'p-2 h-11 w-11',
    [IconButtonSize.LG]: 'p-3 h-14 w-14',
  };

  const iconSizeStyles: Record<IconButtonSize, string> = {
    [IconButtonSize.XS]: 'w-3.5 h-3.5',
    [IconButtonSize.SM]: 'w-4 h-4',
    [IconButtonSize.MD]: 'w-5 h-5',
    [IconButtonSize.LG]: 'w-6 h-6',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      title={title}
      disabled={disabled}
      type='button'
      {...props}
    >
      {cloneElement(icon as ReactElement<{ className?: string }>, {
        className: clsx(iconSizeStyles[size], (icon.props as { className?: string }).className),
      })}
    </button>
  );
};
