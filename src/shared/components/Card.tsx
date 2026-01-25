import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, badge, icon }) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-850 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-800 transition-all duration-200',
        className,
      )}
    >
      {(title || badge || icon) && (
        <div className='flex justify-between items-center mb-4 px-0.5'>
          <div className='flex items-center gap-2.5'>
            {icon && <div className='text-gray-400 dark:text-gray-500'>{icon}</div>}
            {title && (
              <h3 className='text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest'>
                {title}
              </h3>
            )}
          </div>
          {badge && <div className='animate-in fade-in duration-500'>{badge}</div>}
        </div>
      )}
      <div className='relative'>{children}</div>
    </div>
  );
};
