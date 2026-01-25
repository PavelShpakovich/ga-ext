import React from 'react';
import clsx from 'clsx';

export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  OUTLINE = 'outline',
  GHOST = 'ghost',
  DANGER = 'danger',
}

export enum ButtonSize {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = ButtonVariant.PRIMARY,
  size = ButtonSize.MD,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2';

  const variantStyles: Record<ButtonVariant, string> = {
    [ButtonVariant.PRIMARY]:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-lg shadow-blue-600/20 active:scale-[0.98]',
    [ButtonVariant.SECONDARY]:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-slate-300 active:scale-[0.98]',
    [ButtonVariant.OUTLINE]:
      'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 focus:ring-slate-500 active:scale-[0.98]',
    [ButtonVariant.GHOST]:
      'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-500 active:scale-[0.98]',
    [ButtonVariant.DANGER]:
      'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 focus:ring-rose-500 active:scale-[0.98]',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    [ButtonSize.SM]: 'px-4 py-2 text-xs uppercase tracking-wider',
    [ButtonSize.MD]: 'px-5 py-3 text-sm',
    [ButtonSize.LG]: 'px-8 py-4 text-base',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled}
      type='button'
      {...props}
    >
      {children}
    </button>
  );
};
