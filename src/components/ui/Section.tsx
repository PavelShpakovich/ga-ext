import React from 'react';

interface SectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={className}>
      <h3 className='text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2'>{title}</h3>
      {children}
    </div>
  );
};
