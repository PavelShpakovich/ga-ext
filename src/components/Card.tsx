import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, title }) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700',
        className,
      )}
    >
      {title && <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>{title}</h3>}
      {children}
    </div>
  );
};
