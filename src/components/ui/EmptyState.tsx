import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => {
  return (
    <div className='flex items-center justify-center h-full'>
      <div className='text-center text-gray-500 dark:text-gray-400'>
        {icon}
        <p className='text-sm'>{title}</p>
        {description?.map((line, idx) => (
          <p key={idx} className='text-xs mt-2'>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};
