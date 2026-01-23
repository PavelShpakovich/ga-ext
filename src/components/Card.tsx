import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  badge?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, badge }) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700',
        className,
      )}
    >
      <div className='flex justify-between items-center mb-2'>
        {title && <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300'>{title}</h3>}
        {badge && <div>{badge}</div>}
      </div>
      {children}
    </div>
  );
};
