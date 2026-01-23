import React from 'react';
import clsx from 'clsx';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 cursor-pointer';

  const variantStyles = {
    default: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 focus:ring-gray-300',
    ghost: 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 focus:ring-gray-200',
    danger: 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 focus:ring-red-300',
  };

  const sizeStyles = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  return (
    <button className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
      {icon}
    </button>
  );
};
