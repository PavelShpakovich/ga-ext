import React from 'react';
import clsx from 'clsx';

export enum TextButtonVariant {
  DEFAULT = 'default',
  DANGER = 'danger',
}

interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TextButtonVariant;
}

export const TextButton: React.FC<TextButtonProps> = ({
  variant = TextButtonVariant.DEFAULT,
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    'text-[9px] font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantStyles: Record<TextButtonVariant, string> = {
    [TextButtonVariant.DEFAULT]:
      'text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 focus-visible:ring-blue-500/30',
    [TextButtonVariant.DANGER]:
      'text-slate-300 hover:text-red-500 dark:hover:text-red-400 focus-visible:ring-red-500/30',
  };

  return (
    <button
      className={clsx(baseStyles, variantStyles[variant], className)}
      disabled={disabled}
      type='button'
      {...props}
    >
      {children}
    </button>
  );
};
